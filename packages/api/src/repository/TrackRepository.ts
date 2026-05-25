import { tracks, votes, type DB, type Track } from "@fissa/db";
import { and, eq, sql } from "drizzle-orm";

import type { Executor, ITrackRepository, InsertTrackInput } from "../interfaces";
import type { Track as TrackAggregate, TrackOutcome } from "../domain/Track";
import type { OutboxRepository } from "./OutboxRepository";

export class TrackRepository implements ITrackRepository {
  constructor(
    private readonly db: DB,
    private readonly outbox: OutboxRepository,
  ) {}

  findByPin = async (pin: string): Promise<Track[]> => {
    return this.db.query.tracks.findMany({
      where: eq(tracks.pin, pin),
    });
  };

  insertMany = async (input: InsertTrackInput[]): Promise<void> => {
    if (!input.length) return;
    await this.db.insert(tracks).values(input).onConflictDoNothing();
  };

  delete = async (pin: string, trackId: string): Promise<void> => {
    await this.db
      .delete(tracks)
      .where(and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)));
  };

  applyOutcome = async (
    track: TrackAggregate,
    outcome: TrackOutcome,
    tx: Executor,
  ): Promise<void> => {
    const { pin, trackId } = track;
    const where = and(eq(tracks.pin, pin), eq(tracks.trackId, trackId));

    await tx
      .update(tracks)
      .set({
        score: outcome.resetScore ? 0 : sql`${tracks.score} + ${outcome.scoreDelta}`,
        totalScore: sql`${tracks.totalScore} + ${outcome.totalScoreDelta}`,
        ...(outcome.hasBeenPlayed !== undefined ? { hasBeenPlayed: outcome.hasBeenPlayed } : {}),
      })
      .where(where);

    if (outcome.clearVotes) {
      await tx.delete(votes).where(and(eq(votes.pin, pin), eq(votes.trackId, trackId)));
    }

    await this.outbox.append(outcome.events, tx);
  };
}
