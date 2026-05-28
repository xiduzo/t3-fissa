import type { DB, Track } from "@fissa/db";

import type { Track as TrackAggregate, TrackOutcome } from "../domain/Track";

export type InsertTrackInput = {
  trackId: string;
  durationMs: number;
  userId?: string | null;
  pin: string;
};

/** A drizzle database handle or an open transaction — both can build queries. */
export type Executor = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];

export type AddTracksInput = {
  trackId: string;
  durationMs: number;
};

export interface ITrackRepository {
  findByPin(pin: string): Promise<Track[]>;

  insertMany(input: InsertTrackInput[]): Promise<void>;

  delete(pin: string, trackId: string): Promise<void>;

  /**
   * Enqueue tracks for a guest in one transaction: insert the rows, record the
   * guest's self-upvote on each, bump the score so the new track sits one above
   * the floor in the queue order, and append a `TrackAdded` event to the outbox.
   * Self-votes raise no `PointsAwarded` event — a guest never earns from their
   * own vote (ADR-0001).
   */
  addTracks(pin: string, tracks: AddTracksInput[], userId: string): Promise<void>;

  /**
   * Move a track's row to match a {@link TrackOutcome} and append its events to
   * the outbox — both inside the caller's transaction `tx`, so the state change
   * and the events it raised commit together (ADR-0001). The single place that
   * turns a Track command's outcome into persistence.
   */
  applyOutcome(track: TrackAggregate, outcome: TrackOutcome, tx: Executor): Promise<void>;
}
