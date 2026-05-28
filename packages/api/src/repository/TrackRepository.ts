import { tracks, votes, type DB, type Track } from "@fissa/db";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { AddTracksInput, Executor, ITrackRepository, InsertTrackInput } from "../interfaces";
import type { Track as TrackAggregate, TrackOutcome } from "../domain/Track";
import { trackAdded } from "../domain/events";
import type { OutboxRepository } from "./OutboxRepository";

const SELF_VOTE: 1 = 1;

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

  addTracks = async (
    pin: string,
    trackList: AddTracksInput[],
    userId: string,
  ): Promise<void> => {
    if (!trackList.length) return;
    const trackIds = trackList.map(({ trackId }) => trackId);

    await this.db.transaction(async (tx) => {
      await tx
        .insert(tracks)
        .values(trackList.map((track) => ({ ...track, userId, pin })))
        .onConflictDoNothing();

      await tx
        .delete(votes)
        .where(
          and(eq(votes.pin, pin), inArray(votes.trackId, trackIds), eq(votes.userId, userId)),
        );

      await tx
        .update(tracks)
        .set({
          score: sql`${tracks.score} + ${SELF_VOTE}`,
          totalScore: sql`${tracks.totalScore} + ${SELF_VOTE}`,
          hasBeenPlayed: false,
        })
        .where(and(eq(tracks.pin, pin), inArray(tracks.trackId, trackIds)));

      await tx
        .insert(votes)
        .values(trackIds.map((trackId) => ({ pin, trackId, vote: SELF_VOTE, userId })));

      await this.outbox.append([trackAdded({ pin, userId, count: trackList.length })], tx);
    });
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
