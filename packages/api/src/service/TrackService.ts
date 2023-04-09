import { z } from "zod";
import { Track } from "@fissa/db";
import { SpotifyService, Timer } from "@fissa/utils";

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

    await this.voteService.createVotes(
      pin,
      tracks.map(({ trackId }) => trackId),
      1,
    );

    return this.db.track.createMany({ data: newTracks });
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

  reorderTracksFromPlaylist = async (
    pin: string
  ) => {
    const { tracks, currentIndex } = await this.db.room.findUniqueOrThrow({
      where: { pin },
      select: { tracks: true, currentIndex: true },
    });

    const { updateMany, fakeUpdates, newCurrentIndex } =
      this.generateTrackIndexUpdates(tracks, currentIndex);

    if (!updateMany.length) {
      console.info(`No updates needed for room ${pin}`);
      return;
    }

    const timer = new Timer(
      `Reordering ${updateMany.length} tracks for room ${pin}`,
    );

      await this.db.$transaction(
        async (transaction) => {
          console.log("fake updates", fakeUpdates)
          // (1) Clear out the indexes
          await transaction.room.update({
            where: { pin },
            data: { tracks: { updateMany: fakeUpdates } },
          });

          console.log("real updates", updateMany)
          // (2) Set the correct indexes
          await transaction.room.update({
            where: { pin },
            data: {
              tracks: { updateMany },
              currentIndex: newCurrentIndex,
              lastPlayedIndex: newCurrentIndex,
              shouldReorder: false,
            },
          });
        },
      );
      
      timer.duration();
  };

  private generateTrackIndexUpdates = (
    tracks: Track[],
    currentIndex: number,
  ) => {
    const tracksWithScoreOrAfterIndex = tracks.filter(
      ({ score, index }) => score !== 0 || index > currentIndex,
    );
    const tracksWithoutScoreAndBeforeIndex = tracks.filter(
      ({ score, index }) => score === 0 && index <= currentIndex,
    );

    const sortedTracks = [...tracksWithScoreOrAfterIndex].sort(
      (a, b) => b.score - a.score,
    );

    const sorted = tracksWithoutScoreAndBeforeIndex.concat(sortedTracks);
    const newCurrentIndex = sorted.findIndex(
      ({ index }) => index === currentIndex,
    );

    const updateMany = sorted
      .map(({ trackId, index }, newIndex) => {
        if (index === newIndex) return; // No need to update

        return {
          where: { trackId },
          data: { index: newIndex },
        };
      })
      .filter(Boolean);

    const fakeUpdates = updateMany.map((update, index) => ({
      ...update,
      data: { ...update.data, index: index + tracks.length + 100 }, // Set to an index which does not exist
    }));

    return { updateMany, fakeUpdates, newCurrentIndex };
  };
}
