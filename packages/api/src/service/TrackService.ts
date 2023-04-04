import { z } from "zod";
import { SpotifyService } from "@fissa/utils";

import { Z_TRACKS } from "../router/constants";
import { ServiceWithContext } from "../utils/context";

export class TrackService extends ServiceWithContext {
  byPin = async (pin: string) => {
    return this.db.track.findMany({
      where: { pin },
      orderBy: { index: "asc" },
    });
  };

  addTracks = async (pin: string, tracks: z.infer<typeof Z_TRACKS>) => {
    const totalTracks = await this.db.track.count({ where: { pin } });

    const roomTracks = await this.db.track.findMany({
      where: { pin },
    });

    const existingTracks = roomTracks.map(({ trackId }) => trackId);

    const newTracks = tracks.filter(
      ({ trackId }) => !existingTracks.includes(trackId),
    );

    await this.db.track.createMany({
      data: newTracks.map((track, index) => ({
        ...track,
        pin,
        index: totalTracks + index,
      })),
    });

    return existingTracks;
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
