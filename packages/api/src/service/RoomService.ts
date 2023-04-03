import { Room } from "@fissa/db";
import { SpotifyService, addMilliseconds, randomize } from "@fissa/utils";

import { ServiceWithContext } from "../utils/context";

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
    console.log("byId", pin);
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
    console.log("detailsById", pin);
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
    const service = new SpotifyService();
    const room = await this.db.room.findUniqueOrThrow({
      where: { pin },
      select: {
        currentIndex: true,
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

    const isPlaying = service.isStillPlaying(access_token!);

    const currentTrack = room.tracks[room.currentIndex];

    const removeVotes = this.db.vote.deleteMany({
      where: { pin, trackId: currentTrack!.trackId },
    });

    const nextIndex = room.currentIndex + 1;
    const nextTrack = room.tracks[nextIndex]!;
    const shouldAddNewTracks = nextIndex + 3 > room.tracks.length;

    if (shouldAddNewTracks) {
      const recommendations = await service.getRecommendedTracks(
        access_token!,
        room.tracks
          .slice(nextIndex, room.tracks.length)
          .map(({ trackId }) => trackId),
      );

      await this.db.track.createMany({
        data: recommendations.map((track, index) => ({
          pin,
          trackId: track.id,
          durationMs: track.duration_ms,
          index: room.tracks.length + index,
        })),
      });
    }

    if (!(await isPlaying)) {
      return this.db.room.update({
        where: { pin },
        data: { currentIndex: -1 },
      });
    }

    await service.playTrack(access_token!, nextTrack.trackId);

    await this.db.room.update({
      where: { pin },
      data: {
        expectedEndTime: addMilliseconds(new Date(), nextTrack.durationMs),
        currentIndex: { increment: 1 },
        lastPlayedIndex: { increment: 1 },
      },
    });

    await removeVotes;

    if (shouldAddNewTracks) {
      await this.reorderPlaylist(pin);
    }
  };

  private generatePin = () => randomize("A", 4);
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
