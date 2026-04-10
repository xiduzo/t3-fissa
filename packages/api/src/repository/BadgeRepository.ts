import { BADGE, badges, type DB } from "@fissa/db";
import { and, eq, sql } from "drizzle-orm";

import type { Badge, IBadgeRepository } from "../interfaces";

export class BadgeRepository implements IBadgeRepository {
  constructor(private readonly db: DB) {}

  findByUserAndName = async (userId: string, name: BADGE): Promise<Badge | undefined> => {
    return this.db.query.badges.findFirst({
      where: and(eq(badges.userId, userId), eq(badges.name, name)),
    });
  };

  upsertScore = async (userId: string, name: BADGE, amount: number): Promise<void> => {
    await this.db
      .insert(badges)
      .values({ userId, name, score: amount, lastUpdated: new Date() })
      .onConflictDoUpdate({
        target: [badges.userId, badges.name],
        set: { score: sql`${badges.score} + ${amount}`, lastUpdated: new Date() },
      });
  };
}
