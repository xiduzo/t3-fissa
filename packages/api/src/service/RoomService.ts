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
    return this.db.room.findUniqueOrThrow({ where: { pin } });
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
