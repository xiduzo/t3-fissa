import { tracks, votes, type DB } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import type { ITrackRepository, IVoteRepository, Vote } from "../interfaces";
import { Track } from "../domain/Track";
import type { VoteDirection } from "../domain/events";

export class VoteService {
  constructor(
    private readonly voteRepo: IVoteRepository,
    private readonly db: DB,
    private readonly trackRepo: ITrackRepository,
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
      const outcome = track.castVote({
        voterId: userId,
        direction: vote as VoteDirection,
        previousVote: previous?.vote ?? 0,
      });

      await this.trackRepo.applyOutcome(track, outcome, tx);

      const [result] = await tx
        .insert(votes)
        .values({ pin, trackId, vote, userId })
        .onConflictDoUpdate({
          target: [votes.trackId, votes.userId, votes.pin],
          set: { vote },
        })
        .returning();

      return result;
    });
  };

  resetVotes = async (pin: string, trackId: string): Promise<void> => {
    await this.db.delete(votes).where(and(eq(votes.pin, pin), eq(votes.trackId, trackId)));
  };
}
