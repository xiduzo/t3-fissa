import { tracks, usersInFissas, votes } from "@fissa/db";
import { and, eq, inArray, sql } from "drizzle-orm";

import { ServiceWithContext, type Context } from "../utils/context";
import { type BadgeService } from "./BadgeService";

export class VoteService extends ServiceWithContext {
  constructor(ctx: Context, private readonly badgeService: BadgeService) {
    super(ctx);
  }

  getVotesFromTrack = async (pin: string, trackId: string) => {
    return this.db.query.votes.findMany({
      where: and(eq(votes.pin, pin), eq(votes.trackId, trackId)),
    });
  };

  getUserVote = async (pin: string, trackId: string, userId: string) => {
    return this.db.query.votes.findFirst({
      where: and(eq(votes.pin, pin), eq(votes.trackId, trackId), eq(votes.userId, userId)),
    });
  };

  getVotesByFissa = async (pin: string) => {
    const allVotes = await this.db.query.votes.findMany({
      where: eq(votes.pin, pin),
    });

    return allVotes.reduce(
      (acc, { trackId, vote }) => acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );
  };

  createVote = async (pin: string, trackId: string, vote: number, userId: string) => {
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

  createVotes = async (pin: string, trackIds: string[], vote: number, userId: string) => {
    return this.db.transaction(async (tx) => {
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

      return tx
        .insert(votes)
        .values(trackIds.map((trackId) => ({ pin, trackId, vote, userId })));
    });
  };

  resetVotes = async (pin: string, trackId: string) => {
    return this.db.delete(votes).where(and(eq(votes.pin, pin), eq(votes.trackId, trackId)));
  };
}
