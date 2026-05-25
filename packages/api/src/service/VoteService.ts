import { tracks, votes, type DB } from "@fissa/db";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { IVoteRepository, Vote } from "../interfaces";
import type { OutboxRepository } from "../repository/OutboxRepository";
import { Track } from "../domain/Track";
import type { VoteDirection } from "../domain/events";

export class VoteService {
  constructor(
    private readonly voteRepo: IVoteRepository,
    private readonly db: DB,
    private readonly outbox: OutboxRepository,
  ) {}

  getVotesFromTrack = async (pin: string, trackId: string): Promise<Vote[]> => {
    return this.voteRepo.findByTrack(pin, trackId);
  };

  getUserVote = async (pin: string, trackId: string, userId: string): Promise<Vote | undefined> => {
    return this.voteRepo.findByUser(pin, trackId, userId);
  };

  getVotesByFissa = async (pin: string): Promise<Map<string, number>> => {
    const allVotes = await this.voteRepo.findByFissa(pin);
    return allVotes.reduce(
      (acc, { trackId, vote }) => acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );
  };

  getVotesByFissaFromUser = async (pin: string, userId: string): Promise<Vote[]> => {
    return this.voteRepo.findByFissaFromUser(pin, userId);
  };

  /**
   * Cast or re-cast a vote on one track. The Track aggregate owns the score
   * delta and the no-self-earn rule; the owner's reward rides a `PointsAwarded`
   * event the outbox drainer folds into their Wallet later (earning is eventual,
   * ADR-0001).
   */
  createVote = async (
    pin: string,
    trackId: string,
    vote: number,
    userId: string,
  ): Promise<Vote | undefined> => {
    return this.db.transaction(async (tx) => {
      const existing = await tx.query.tracks.findFirst({
        where: and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)),
        columns: { userId: true, score: true },
      });
      if (!existing) return undefined;

      const previous = await tx.query.votes.findFirst({
        where: and(eq(votes.pin, pin), eq(votes.trackId, trackId), eq(votes.userId, userId)),
      });

      const track = new Track(pin, trackId, existing.userId ?? null, existing.score);
      const { scoreDelta, events } = track.castVote({
        voterId: userId,
        direction: vote as VoteDirection,
        previousVote: previous?.vote ?? 0,
      });

      await tx
        .update(tracks)
        .set({
          score: sql`${tracks.score} + ${scoreDelta}`,
          totalScore: sql`${tracks.totalScore} + ${scoreDelta}`,
          hasBeenPlayed: false,
        })
        .where(and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)));

      const [result] = await tx
        .insert(votes)
        .values({ pin, trackId, vote, userId })
        .onConflictDoUpdate({
          target: [votes.trackId, votes.userId, votes.pin],
          set: { vote },
        })
        .returning();

      await this.outbox.append(events, tx);

      return result;
    });
  };

  /**
   * Bulk auto-upvotes applied when a guest adds tracks they queued themselves.
   * These are self-votes — no points change hands — so no events are raised.
   */
  createVotes = async (
    pin: string,
    trackIds: string[],
    vote: number,
    userId: string,
  ): Promise<void> => {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(votes)
        .where(and(eq(votes.pin, pin), inArray(votes.trackId, trackIds), eq(votes.userId, userId)));

      await tx
        .update(tracks)
        .set({
          score: sql`${tracks.score} + ${vote}`,
          totalScore: sql`${tracks.totalScore} + ${vote}`,
          hasBeenPlayed: false,
        })
        .where(and(eq(tracks.pin, pin), inArray(tracks.trackId, trackIds)));

      await tx
        .insert(votes)
        .values(trackIds.map((trackId) => ({ pin, trackId, vote, userId })));
    });
  };

  resetVotes = async (pin: string, trackId: string): Promise<void> => {
    await this.db.delete(votes).where(and(eq(votes.pin, pin), eq(votes.trackId, trackId)));
  };
}
