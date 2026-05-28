import { votes, type DB } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import type { IVoteRepository, Vote } from "../interfaces";

export class VoteRepository implements IVoteRepository {
  constructor(private readonly db: DB) {}

  findByTrack = async (pin: string, trackId: string): Promise<Vote[]> => {
    return this.db.query.votes.findMany({
      where: and(eq(votes.pin, pin), eq(votes.trackId, trackId)),
    });
  };

  findByUser = async (pin: string, trackId: string, userId: string): Promise<Vote | undefined> => {
    return this.db.query.votes.findFirst({
      where: and(eq(votes.pin, pin), eq(votes.trackId, trackId), eq(votes.userId, userId)),
    });
  };

  findByFissa = async (pin: string): Promise<Vote[]> => {
    return this.db.query.votes.findMany({
      where: eq(votes.pin, pin),
    });
  };

  findByFissaFromUser = async (pin: string, userId: string): Promise<Vote[]> => {
    return this.db.query.votes.findMany({
      where: and(eq(votes.pin, pin), eq(votes.userId, userId)),
    });
  };

  getScoresByFissa = async (pin: string): Promise<Map<string, number>> => {
    const allVotes = await this.findByFissa(pin);
    return allVotes.reduce(
      (acc, { trackId, vote }) => acc.set(trackId, (acc.get(trackId) ?? 0) + vote),
      new Map<string, number>(),
    );
  };
}
