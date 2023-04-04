import { Room } from "@fissa/db";
import {
  SpotifyService,
  addMilliseconds,
  differenceInMilliseconds,
  randomize,
} from "@fissa/utils";

import { ServiceWithContext } from "../utils/context";
import { TrackService } from "./TrackService";

export class RoomService extends ServiceWithContext {
  all = async () => {
    return this.db.room.findMany({
      where: { currentIndex: { gte: 0 } },
      select: { pin: true, expectedEndTime: true, currentIndex: true },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    const service = new SpotifyService();

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

    await service.playTrack(access_token!, tracks[0]!.trackId);

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
    return this.db.room.findUniqueOrThrow({
      where: { pin },
      select: {
        by: { select: { email: true } },
        expectedEndTime: true,
        currentIndex: true,
      },
    });
  };

  reorderPlaylist = async (pin: string) => {
    const { currentIndex } = await this.byId(pin);
    const tracks = await this.db.track.findMany({
      where: { pin },
      select: { trackId: true, index: true, score: true },
      orderBy: { index: "asc" },
    });

    const sorted = [...tracks]
      .sort((a, b) => b.score - a.score)
      .filter(({ index, score }) => index > currentIndex || score !== 0);

    const unshiftCurrentIndex = sorted.filter(
      (track) => track.index < currentIndex,
    ).length;

    try {
      const update = sorted
        .map(({ trackId, index }, newIndex) => {
          const updateIndexTo =
            currentIndex - unshiftCurrentIndex + newIndex + 1;
          if (index === updateIndexTo) return; // No need to update

          return {
            where: { pin_trackId: { pin, trackId } },
            data: { index: updateIndexTo },
          };
        })
        .filter(Boolean);

      const updateToHighIndex = update.map((x, index) => ({
        ...x,
        data: {
          ...x.data,
          index: tracks.length + index,
        },
      }));

      await this.db.$transaction(async (transaction) => {
        // (1) Clear out the indexes
        await transaction.room.update({
          where: { pin },
          data: { tracks: { update: updateToHighIndex } },
        });

        // (2) Set the correct indexes
        await transaction.room.update({
          where: { pin },
          data: { tracks: { update } },
        });

        if (currentIndex !== currentIndex - unshiftCurrentIndex) {
          await transaction.room.update({
            where: { pin },
            data: { currentIndex: currentIndex - unshiftCurrentIndex },
          });
        }
      });
    } catch (e) {
      console.log(e);
    }

    return true;
  };

  skipTrack = async (pin: string) => {
    const room = await this.byId(pin);

    if (room.userId !== this.ctx.session?.user.id)
      throw new Error("Not authorized");

    return this.nextTrack(pin, room.currentIndex);
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

  nextTrack = async (pin: string, currentIndex: number) => {
    const room = await this.db.room.findUniqueOrThrow({
      where: { pin },
      select: {
        currentIndex: true,
        expectedEndTime: true,
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

    if (room.currentIndex !== currentIndex) return;

    const { access_token } = room.by.accounts[0]!;
    const { tracks } = room;

    try {
      const spotifyService = new SpotifyService();

      const isPlaying = spotifyService.isStillPlaying(access_token!);

      const currentTrack = tracks[room.currentIndex];

      const removeVotes = this.db.vote.deleteMany({
        where: { pin, trackId: currentTrack!.trackId },
      });

      const nextIndex = room.currentIndex + 1;
      const nextTrack = tracks[nextIndex]!;
      const shouldAddNewTracks = nextIndex + 3 > tracks.length;

      if (shouldAddNewTracks) {
        const trackService = new TrackService(this.ctx);

        const trackIds = tracks
          .slice(nextIndex, tracks.length)
          .map(({ trackId }) => trackId);

        await trackService.addRecommendedTracks(
          pin,
          trackIds,
          tracks.length,
          access_token!,
        );
      }

      if (!(await isPlaying)) return this.stopRoom(pin);

      await this.playTrack(
        room.expectedEndTime,
        nextTrack.trackId,
        access_token!,
      );
      await this.roomPlaysNextTrack(pin, nextTrack.durationMs);

      await removeVotes;

      if (shouldAddNewTracks) await this.reorderPlaylist(pin);
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
    const service = new SpotifyService();
    const playIn = differenceInMilliseconds(expectedEndTime, new Date());
    console.log("Playing track in: ", playIn, performance.now());
    await new Promise((resolve) => setTimeout(resolve, playIn));
    console.log("Playing track now", performance.now());
    await service.playTrack(accessToken, trackId);
  };

  private stopRoom = async (pin: string) => {
    return this.db.room.update({
      where: { pin },
      data: { currentIndex: -1 },
    });
  };

  private roomPlaysNextTrack = async (pin: string, durationMs: number) => {
    await this.db.room.update({
      where: { pin },
      data: {
        expectedEndTime: addMilliseconds(new Date(), durationMs),
        currentIndex: { increment: 1 },
        lastPlayedIndex: { increment: 1 },
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
