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

export interface ITrackRepository {
  findByPin(pin: string): Promise<Track[]>;

  insertMany(input: InsertTrackInput[]): Promise<void>;

  delete(pin: string, trackId: string): Promise<void>;

  /**
   * Move a track's row to match a {@link TrackOutcome} and append its events to
   * the outbox — both inside the caller's transaction `tx`, so the state change
   * and the events it raised commit together (ADR-0001). The single place that
   * turns a Track command's outcome into persistence.
   */
  applyOutcome(track: TrackAggregate, outcome: TrackOutcome, tx: Executor): Promise<void>;
}
