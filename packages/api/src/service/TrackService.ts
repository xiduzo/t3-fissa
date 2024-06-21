import { type z } from "zod";

import { type Z_TRACKS } from "../router/constants";
import { ServiceWithContext, type Context } from "../utils/context";
import { type BadgeService } from "./BadgeService";
import { type VoteService } from "./VoteService";

export class TrackService extends ServiceWithContext {
  constructor(ctx: Context, private readonly voteService: VoteService, private readonly badgeService: BadgeService) {
    super(ctx);
  }

  byPin = async (pin: string) => {
    return this.db.track.findMany({ where: { pin } });
  };

  addTracks = async (pin: string, tracks: z.infer<typeof Z_TRACKS>, userId: string) => {
    await this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          createMany: {
            data: tracks.map(track => ({ ...track, userId })),
            skipDuplicates: true,
          },
        },
      },
    });

    await this.badgeService.tracksAdded(tracks.length)

    const trackIds = tracks.map(({ trackId }) => trackId);

    return this.voteService.createVotes(pin, trackIds, 1, userId);
  };

  deleteTrack = async (pin: string, trackId: string) => {
    try {
      return this.db.track.delete({ where: { pin_trackId: { pin, trackId } } });
    } catch (error) {
      // If the track is not found, we can ignore the error
      // TODO: make a generic prisma error handler
      // https://www.prisma.io/docs/orm/reference/error-reference#prismaclientknownrequesterror
      return Promise.resolve()
    }
  };
}
