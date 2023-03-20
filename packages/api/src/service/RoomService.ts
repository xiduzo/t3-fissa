import { randomize } from "@fissa/utils";

import { ServiceWithContext } from "../utils/context";

export class RoomService extends ServiceWithContext {
  create = async () => {
    let pin: string | undefined = undefined;
    let tries = 0;
    const blockedPins: string[] = [];

    do {
      const _pin = this.generatePin();

      if (noNoWords.includes(_pin.toLowerCase())) continue;
      if (blockedPins.includes(_pin)) continue;

      try {
        await this.db.room.create({
          data: {
            pin: _pin,
            by: { connect: { id: this.ctx.session?.user.id } },
          },
        });
      } catch (e) {
        tries++;
        blockedPins.push(_pin);
      }

      pin = _pin;
    } while (!pin && tries < 10);

    return this.byId(pin!);
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
