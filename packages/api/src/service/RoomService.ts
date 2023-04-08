import { Prisma, Room, Track } from "@fissa/db";
import {
  NotTheHost,
  SpotifyService,
  addMilliseconds,
  differenceInMilliseconds,
  randomize,
} from "@fissa/utils";

import { Context, ServiceWithContext } from "../utils/context";
import { TrackService } from "./TrackService";

export class RoomService extends ServiceWithContext {
  private spotifyService: SpotifyService;
  private trackService: TrackService;

  constructor(
    ctx: Context,
    spotifyService?: SpotifyService,
    trackService?: TrackService,
  ) {
    super(ctx);
    this.spotifyService = spotifyService ?? new SpotifyService();
    this.trackService = trackService ?? new TrackService(ctx);
  }

  activeRooms = async () => {
    return this.db.room.findMany({
      where: { currentIndex: { gte: 0 } },
      select: {
        pin: true,
        expectedEndTime: true,
        currentIndex: true,
        shouldReorder: true,
      },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    const spotifyService = new SpotifyService();

    let room: Room | undefined = undefined;
    let tries = 0;
    const blockedPins = [...noNoWords];

    const tokens = this.db.account.findFirstOrThrow({
      where: { userId: this.ctx.session?.user.id },
      select: { access_token: true },
    });

    await this.db.room.deleteMany({
      where: { userId: this.ctx.session?.user.id },
    });

    do {
      const pin = this.generatePin();

      if (blockedPins.includes(pin.toLowerCase())) continue;

      try {
        room = await this.db.room.create({
          data: {
            pin,
            expectedEndTime: addMilliseconds(new Date(), tracks[0]!.durationMs),
            by: { connect: { id: this.ctx.session?.user.id } },
            tracks: {
              createMany: {
                data: tracks.map((track, index) => ({ ...track, index })),
              },
            },
          },
        });
      } catch (e) {
        tries++;
        blockedPins.push(pin);
      }
    } while (!room && tries < 50);

    const { access_token } = await tokens;

    await this.spotifyService.playTrack(access_token!, tracks[0]!.trackId);

    return this.byId(room?.pin!);
  };

  byId = async (pin: string) => {
    return this.db.room.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: {
          select: { trackId: true, score: true },
          orderBy: { index: "asc" },
        },
      },
    });
  };

  detailsById = async (pin: string) => {
    return this.db.room.findUnique({
      where: { pin },
      select: {
        by: { select: { email: true } },
        expectedEndTime: true,
        currentIndex: true,
      },
    });
  };

  skipTrack = async (pin: string) => {
    const room = await this.byId(pin);

    if (room.userId !== this.ctx.session?.user.id)
      throw new Error("Not authorized");

    return this.playNextTrack(pin, room.currentIndex, true);
  };

  restart = async (pin: string) => {
    const room = await this.db.room.findUniqueOrThrow({
      where: { pin },
      select: {
        lastPlayedIndex: true,
        userId: true,
        by: {
          select: {
            accounts: { select: { access_token: true }, take: 1 },
          },
        },
        tracks: {
          select: { trackId: true, durationMs: true },
          orderBy: { index: "asc" },
        },
      },
    });

    if (room.userId !== this.ctx.session?.user.id)
      throw new Error("Not authorized");

    const service = new SpotifyService();

    const { access_token } = room.by.accounts[0]!;
    const track = room.tracks[room.lastPlayedIndex]!;

    await service.playTrack(access_token!, track.trackId);

    return this.db.room.update({
      where: { pin },
      data: {
        currentIndex: room.lastPlayedIndex,
        expectedEndTime: addMilliseconds(new Date(), track.durationMs),
      },
    });
  };

  playNextTrack = async (
    pin: string,
    currentIndex: number,
    instantPlay = false,
  ) => {
    const room = await this.getRoomDetailedInformation(pin);

    if (room.currentIndex !== currentIndex) return;

    const { access_token } = room.by.accounts[0]!;
    const { tracks } = room;

    try {
      const isPlaying = this.spotifyService.isStillPlaying(access_token!);

      const currentTrack = tracks[room.currentIndex]!;
      const nextIndex = room.currentIndex + 1;
      const nextTrack = tracks[nextIndex]!;

      // TODO this can maybe also be updated in the `this.updateRoomIndexes`
      const removeVotes = this.db.vote.deleteMany({
        where: {
          pin,
          trackId: { in: [currentTrack.trackId, nextTrack.trackId] },
        },
      });

      // Automatically add more tracks to the playlist
      if (nextIndex + 3 > tracks.length) {
        const trackIds = tracks
          .slice(nextIndex, tracks.length)
          .map(({ trackId }) => trackId);

        await this.trackService.addRecommendedTracks(
          pin,
          trackIds,
          tracks.length,
          access_token!,
        );
      }

      if (!(await isPlaying)) return this.stopRoom(pin);

      await this.playTrack(
        instantPlay ? new Date() : room.expectedEndTime,
        nextTrack.trackId,
        access_token!,
      );
      await this.updateRoomIndexes(pin, currentIndex, nextTrack.durationMs);

      await removeVotes;
    } catch (e) {
      console.error(e);
      return this.stopRoom(pin);
    }
  };

  private generatePin = () => randomize("A", 4);

  private playTrack = async (
    expectedEndTime: Date,
    trackId: string,
    accessToken: string,
  ) => {
    const playIn = differenceInMilliseconds(expectedEndTime, new Date());
    await new Promise((resolve) => setTimeout(resolve, playIn)); // Wait for track to end
    await this.spotifyService.playTrack(accessToken, trackId);
  };

  private stopRoom = async (pin: string) => {
    return this.db.room.update({
      where: { pin },
      data: { currentIndex: -1 },
    });
  };

  private updateRoomIndexes = async (
    pin: string,
    currentIndex: number,
    durationMs: number,
  ) => {
    return this.db.room.update({
      where: { pin },
      data: {
        expectedEndTime: addMilliseconds(new Date(), durationMs),
        currentIndex: { increment: 1 },
        lastPlayedIndex: { increment: 1 },
        tracks: {
          updateMany: {
            where: { index: { in: [currentIndex, currentIndex + 1] } },
            data: { score: 0 },
          },
        },
      },
    });
  };

  private getRoomDetailedInformation = async (pin: string) => {
    return await this.db.room.findUniqueOrThrow({
      where: { pin },
      select: {
        currentIndex: true,
        expectedEndTime: true,
        by: {
          select: {
            accounts: { select: { access_token: true }, take: 1 },
          },
        },
        tracks: { orderBy: { index: "asc" } },
      },
    });
  };
}

const noNoWords = [
  "anal",
  "anus",
  "arse",
  "bdsm",
  "boob",
  "butt",
  "clit",
  "cock",
  "coon",
  "crap",
  "cunt",
  "dick",
  "dumb",
  "dvda",
  "dyke",
  "fuck",
  "gook",
  "guro",
  "hell",
  "homo",
  "jerk",
  "jizz",
  "junk",
  "jugs",
  "kike",
  "milf",
  "mong",
  "nsfw",
  "orgy",
  "paki",
  "piss",
  "poof",
  "poon",
  "porn",
  "pthc",
  "quim",
  "rape",
  "scat",
  "scum",
  "sexo",
  "sexy",
  "shag",
  "shit",
  "slag",
  "slut",
  "smut",
  "spic",
  "suck",
  "tits",
  "turd",
  "twat",
  "wank",
];
