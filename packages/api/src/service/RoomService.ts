import { Room } from "@fissa/db";
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
        .map(({ trackId, index, score }, newIndex) => {
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
