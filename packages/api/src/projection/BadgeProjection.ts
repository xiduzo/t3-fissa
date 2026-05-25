import { BADGE, badges, type DB } from "@fissa/db";
import { differenceInHours } from "@fissa/utils";
import { and, eq, sql } from "drizzle-orm";

import type { DomainEvent } from "../domain/events";

type Executor = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];

/**
 * Badges are a projection, not an aggregate (ADR-0001): they fold domain events
 * into per-user lifetime counters and protect no invariant. Some badges debounce
 * (max once / 24h). Drained from the outbox at-least-once, so every fold is an
 * additive upsert — idempotency is guaranteed by the outbox marking each event
 * processed once, not by this code.
 */
export class BadgeProjection {
  constructor(private readonly db: DB) {}

  apply = async (event: DomainEvent, tx: Executor = this.db): Promise<void> => {
    switch (event.type) {
      case "PointsAwarded":
        return this.bump(event.userId, BADGE.POINTS_EARNED, event.amount, tx);

      case "VoteCast": {
        const cast = event.direction > 0 ? BADGE.UP_VOTES_CAST : BADGE.DOWN_VOTES_CAST;
        await this.bump(event.byUser, cast, 1, tx);
        if (event.forUser && event.forUser !== event.byUser) {
          const received =
            event.direction > 0 ? BADGE.UP_VOTES_RECEIVED : BADGE.DOWN_VOTES_RECEIVED;
          await this.bump(event.forUser, received, 1, tx);
        }
        return;
      }

      case "TrackAdded":
        return this.bump(event.userId, BADGE.TRACKS_ADDED, event.count, tx);

      case "FissaCreated":
        return this.bumpDebounced(event.userId, BADGE.FISSAS_CREATED, tx);

      case "MemberJoined":
        return this.bumpDebounced(event.userId, BADGE.FISSAS_JOINED, tx);
    }
  };

  private bump = async (
    userId: string,
    name: BADGE,
    amount: number,
    tx: Executor,
  ): Promise<void> => {
    await tx
      .insert(badges)
      .values({ userId, name, score: amount, lastUpdated: new Date() })
      .onConflictDoUpdate({
        target: [badges.userId, badges.name],
        set: { score: sql`${badges.score} + ${amount}`, lastUpdated: new Date() },
      });
  };

  /** Increment at most once per 24h for the given user+badge. */
  private bumpDebounced = async (
    userId: string,
    name: BADGE,
    tx: Executor,
  ): Promise<void> => {
    const existing = await tx.query.badges.findFirst({
      where: and(eq(badges.userId, userId), eq(badges.name, name)),
    });
    if (existing && differenceInHours(existing.lastUpdated, new Date()) < 24) return;
    await this.bump(userId, name, 1, tx);
  };
}
