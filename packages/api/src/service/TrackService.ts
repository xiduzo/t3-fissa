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
      orderBy: { index: "asc" },
    });
  };

  addTracks = async (pin: string, tracks: z.infer<typeof Z_TRACKS>) => {
    const room = await this.db.room.findUniqueOrThrow({
      where: { pin },
      select: {
        currentIndex: true,
        tracks: { select: { trackId: true } },
      },
    });

    const roomTrackIds = room.tracks.map(({ trackId }) => trackId);

    const newTracks = tracks
      .filter(({ trackId }) => !roomTrackIds.includes(trackId))
      .map((track, index) => ({
        ...track,
        pin,
        index: room.tracks.length + index,
      }));

    const addedTracks = await this.db.track.createMany({ data: newTracks });

    await this.voteService.createVotes(
      pin,
      tracks.map(({ trackId }) => trackId),
      1,
    );

    return addedTracks;
  };

  addRecommendedTracks = async (
    pin: string,
    trackIds: string[],
    startingIndex: number,
    accessToken: string,
  ) => {
    const service = new SpotifyService();
    const recommendations = await service.getRecommendedTracks(
      accessToken,
      trackIds,
    );

    return this.db.track.createMany({
      data: recommendations.map((track, index) => ({
        pin,
        trackId: track.id,
        durationMs: track.duration_ms,
        index: startingIndex + index,
      })),
    });
  };
}
