import { type z } from "zod";

import { tracks } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import { type Z_TRACKS } from "../router/constants";
import { ServiceWithContext, type Context } from "../utils/context";
import { type BadgeService } from "./BadgeService";
import { type VoteService } from "./VoteService";

export class TrackService extends ServiceWithContext {
  constructor(ctx: Context, private readonly voteService: VoteService, private readonly badgeService: BadgeService) {
    super(ctx);
  }

  byPin = async (pin: string) => {
    return this.db.query.tracks.findMany({
      where: eq(tracks.pin, pin),
    });
  };

  addTracks = async (pin: string, trackList: z.infer<typeof Z_TRACKS>, userId: string) => {
    await this.db
      .insert(tracks)
      .values(trackList.map((track) => ({ ...track, userId, pin })))
      .onConflictDoNothing();

    await this.badgeService.tracksAdded(trackList.length);

    const trackIds = trackList.map(({ trackId }) => trackId);
    return this.voteService.createVotes(pin, trackIds, 1, userId);
  };

  deleteTrack = async (pin: string, trackId: string) => {
    try {
      return await this.db
        .delete(tracks)
        .where(and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)));
    } catch {
      // If the track is not found, ignore the error
      return Promise.resolve();
    }
  };
}
