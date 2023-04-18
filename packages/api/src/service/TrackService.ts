import { z } from "zod";
import { SpotifyService } from "@fissa/utils";

import { Z_TRACKS } from "../router/constants";
import { Context, ServiceWithContext } from "../utils/context";
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

    const newTracks = tracks.filter(
      ({ trackId }) => !fissaTrackIds.includes(trackId),
    );

    await this.db.fissa.update({
      where: { pin },
      data: {
        tracks: { createMany: { data: newTracks, skipDuplicates: true } },
      },
    });

    return this.voteService.createVotes(
      pin,
      tracks.map(({ trackId }) => trackId),
      1,
    );
  };

  addRecommendedTracks = async (
    pin: string,
    trackIds: string[],
    accessToken: string,
  ) => {
    const service = new SpotifyService();
    const recommendations = await service.getRecommendedTracks(
      accessToken,
      trackIds,
    );

    return this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          createMany: {
            data: recommendations.map(({ id, duration_ms }) => ({
              trackId: id,
              durationMs: duration_ms,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  };
}
