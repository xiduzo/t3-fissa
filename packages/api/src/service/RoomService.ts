import { Room, VOTE } from "@fissa/db";
import { randomize } from "@fissa/utils";

import { ServiceWithContext } from "../utils/context";

export class RoomService extends ServiceWithContext {
  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    let room: Room | undefined = undefined;
    let tries = 0;
    const blockedPins = [...noNoWords];

    do {
      const pin = this.generatePin();

      if (blockedPins.includes(pin.toLowerCase())) continue;

      try {
        room = await this.db.room.create({
          data: {
            pin,
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

    return this.byId(room?.pin!);
  };

  byId = async (pin: string) => {
    return this.db.room.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
      },
    });
  };

  reorderPlaylist = async (pin: string) => {
    const room = await this.byId(pin);
    const tracks = await this.db.track.findMany({
      where: { roomId: pin },
      select: {
        trackId: true,
        index: true,
        votes: { select: { vote: true } },
      },
      orderBy: { index: "asc" },
    });

    const sorted = [...tracks]
      .sort((a, b) => {
        const aTotal = a.votes.reduce(this.countVotes, 0);
        const bTotal = b.votes.reduce(this.countVotes, 0);

        return bTotal - aTotal;
      })
      .filter((track) => {
        if (track.index > room.currentIndex) return true;

        return track.votes.length > 0;
      });

    const unshiftCurrentIndex = sorted.filter(
      (track) => track.index < room.currentIndex,
    ).length;

    try {
      const update = sorted
        .map(({ trackId, index }, newIndex) => {
          const updateIndexTo =
            room.currentIndex - unshiftCurrentIndex + newIndex + 1;
          if (index === updateIndexTo) return; // No need to update

          return {
            where: { roomId_trackId: { roomId: pin, trackId } },
            data: { index: updateIndexTo },
          };
        })
        .filter(Boolean);

      const updateToHighIndex = update.map((x, index) => ({
        ...x,
        data: {
          ...x.data,
          index: 10000 + index,
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

        if (room.currentIndex !== room.currentIndex - unshiftCurrentIndex) {
          await transaction.room.update({
            where: { pin },
            data: { currentIndex: room.currentIndex - unshiftCurrentIndex },
          });
        }
      });
    } catch (e) {
      console.log(e);
    }

    return true;
  };

  private generatePin = () => randomize("A", 4);

  private countVotes = (acc: number, { vote }: { vote: VOTE }) =>
    acc + (vote === "UP" ? 1 : -1);
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
