import { tracks, usersInFissas, votes, type DB } from "@fissa/db";
import { and, eq, inArray, sql } from "drizzle-orm";

import type { IBadgeService, IVoteRepository, IVoteRepository as _IVoteRepository, Vote } from "../interfaces";

export class VoteService {
  constructor(
    private readonly voteRepo: IVoteRepository,
    private readonly db: DB,
    private readonly badgeService: IBadgeService,
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

  createVote = async (
    pin: string,
    trackId: string,
    vote: number,
    userId: string,
  ): Promise<Vote | undefined> => {
    return this.db.transaction(async (tx) => {
      const previousVote = await tx.query.votes.findFirst({
        where: and(eq(votes.pin, pin), eq(votes.trackId, trackId), eq(votes.userId, userId)),
      });

      const voteWeight = previousVote ? vote - previousVote.vote : vote;

      const [track] = await tx
        .update(tracks)
        .set({
          score: sql`${tracks.score} + ${voteWeight}`,
          totalScore: sql`${tracks.totalScore} + ${voteWeight}`,
          hasBeenPlayed: false,
        })
        .where(and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)))
        .returning();

      if (track?.userId && track.userId !== userId) {
        await this.badgeService.voted(voteWeight, track.userId);
        await tx
          .update(usersInFissas)
          .set({ points: sql`${usersInFissas.points} + ${voteWeight}` })
          .where(and(eq(usersInFissas.pin, pin), eq(usersInFissas.userId, track.userId)));
      }

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
