import { Room } from "@fissa/db";
import { randomize } from "@fissa/utils";

import { ServiceWithContext } from "../utils/context";
import { TrackService } from "./TrackService";

export class RoomService extends ServiceWithContext {
  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    let pin: string | undefined = undefined;
    let tries = 0;
    const blockedPins = [...noNoWords];

    do {
      const _pin = this.generatePin();

      if (blockedPins.includes(_pin.toLowerCase())) continue;

      try {
        await this.db.room.create({
          data: {
            pin: _pin,
            by: { connect: { id: this.ctx.session?.user.id } },
            // TODO: who does this throw an error
            // tracks: {
            //   createMany: {
            //     data: tracks.map((track, index) => ({
            //       ...track,
            //       roomId: _pin,
            //       index,
            //     })),
            //   },
            // },
          },
        });
      } catch (e) {
        tries++;
        blockedPins.push(_pin);
      }

      pin = _pin;
    } while (!pin && tries < 50);

    const trackService = new TrackService(this.ctx);
    await trackService.addTracks({
      roomId: pin!,
      tracks,
    });

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
