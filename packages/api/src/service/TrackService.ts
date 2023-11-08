import { type z } from "zod";
import { SpotifyService } from "@fissa/utils";

import { type Z_TRACKS } from "../router/constants";
import { ServiceWithContext, type Context } from "../utils/context";
import { VoteService } from "./VoteService";

export class TrackService extends ServiceWithContext {
  private voteService: VoteService;

  constructor(ctx: Context, voteService?: VoteService) {
    super(ctx);
    this.voteService = voteService ?? new VoteService(ctx);
  }

  byPin = async (pin: string) => {
    return this.db.track.findMany({
      where: { pin },
      orderBy: { createdAt: "asc" },
    });
  };

  addTracks = async (pin: string, tracks: z.infer<typeof Z_TRACKS>) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: { tracks: { select: { trackId: true } } },
    });

    const fissaTrackIds = fissa.tracks.map(({ trackId }) => trackId);

    const newTracks = tracks.filter(({ trackId }) => !fissaTrackIds.includes(trackId));

    await this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          createMany: {
            data: newTracks.map((track) => ({
              ...track,
              userId: this.ctx.session?.user?.id,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    const trackIds = tracks.map(({ trackId }) => trackId);

    return this.voteService.createVotes(pin, trackIds, 1);
  };

  addRecommendedTracks = async (pin: string, trackIds: string[], accessToken: string) => {
    const service = new SpotifyService();
    const recommendations = await service.getRecommendedTracks(accessToken, trackIds);

    return this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          createMany: {
            data: recommendations.map(({ id, duration_ms }) => ({
              trackId: id,
              durationMs: duration_ms,
              userId: this.ctx.session?.user?.id,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  };

  deleteTrack = async (pin: string, trackId: string) => {
    return this.db.track.delete({
      where: { pin_trackId: { pin, trackId } },
    });
  };
}
