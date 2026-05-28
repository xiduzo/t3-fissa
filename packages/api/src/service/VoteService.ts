import { tracks, votes, type DB } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import type { ITrackRepository, Vote } from "../interfaces";
import { Track } from "../domain/Track";
import type { VoteDirection } from "../domain/events";

/**
 * Vote command service. The only thing it owns is `createVote` — load the
 * Track aggregate under a transaction, let it cast the vote (re-vote delta,
 * no-self-earn rule), persist the outcome through `trackRepo.applyOutcome`,
 * and upsert the vote row. Read paths used to live here as 1:1 pass-throughs
 * to `voteRepo`; they're gone now and the router calls the repo directly.
 */
export class VoteService {
  constructor(
    private readonly db: DB,
    private readonly trackRepo: ITrackRepository,
  ) {}

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
}
