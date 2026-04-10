import { BADGE, badges, fissas } from "@fissa/db";
import { differenceInHours } from "@fissa/utils";
import { and, eq, sql } from "drizzle-orm";

import { ServiceWithContext } from "../utils/context";

export class BadgeService extends ServiceWithContext {
  async fissaCreated() {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      await this.db.transaction(async (tx) => {
        const point = await tx.query.badges.findFirst({
          where: and(eq(badges.userId, userId), eq(badges.name, BADGE.FISSAS_CREATED)),
        });

        if (!point) {
          await tx.insert(badges).values({ userId, name: BADGE.FISSAS_CREATED, score: 1, lastUpdated: new Date() });
          return;
        }

        if (differenceInHours(point.lastUpdated, new Date()) < 24) return;

        await tx
          .update(badges)
          .set({ score: sql`${badges.score} + 1`, lastUpdated: new Date() })
          .where(and(eq(badges.userId, userId), eq(badges.name, BADGE.FISSAS_CREATED)));
      });
    } catch (error) {
      console.warn(error);
    }
  }

  async joinedFissa(pin: string) {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      await this.db.transaction(async (tx) => {
        const fissa = await tx.query.fissas.findFirst({
          where: eq(fissas.pin, pin),
          columns: { userId: true },
        });

        if (fissa?.userId === userId) return;

        const point = await tx.query.badges.findFirst({
          where: and(eq(badges.userId, userId), eq(badges.name, BADGE.FISSAS_JOINED)),
        });

        if (!point) {
          await tx.insert(badges).values({ userId, name: BADGE.FISSAS_JOINED, score: 1, lastUpdated: new Date() });
          return;
        }

        if (differenceInHours(point.lastUpdated, new Date()) < 24) return;

        await tx
          .update(badges)
          .set({ score: sql`${badges.score} + 1`, lastUpdated: new Date() })
          .where(and(eq(badges.userId, userId), eq(badges.name, BADGE.FISSAS_JOINED)));
      });
    } catch (error) {
      console.warn(error);
    }
  }

  async tracksAdded(amount: number) {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      await this.db
        .insert(badges)
        .values({ userId, name: BADGE.TRACKS_ADDED, score: amount, lastUpdated: new Date() })
        .onConflictDoUpdate({
          target: [badges.userId, badges.name],
          set: { score: sql`${badges.score} + ${amount}`, lastUpdated: new Date() },
        });
    } catch (error) {
      console.warn(error);
    }
  }

  async voted(vote: number, forUser?: string | null) {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      await this.db.transaction(async (tx) => {
        const name = vote > 0 ? BADGE.UP_VOTES_CAST : BADGE.DOWN_VOTES_CAST;
        await tx
          .insert(badges)
          .values({ name, userId, score: 1, lastUpdated: new Date() })
          .onConflictDoUpdate({
            target: [badges.userId, badges.name],
            set: { score: sql`${badges.score} + 1`, lastUpdated: new Date() },
          });

        if (forUser && forUser !== userId) {
          const forName = vote > 0 ? BADGE.UP_VOTES_RECEIVED : BADGE.DOWN_VOTES_RECEIVED;
          await tx
            .insert(badges)
            .values({ userId: forUser, name: forName, score: 1, lastUpdated: new Date() })
            .onConflictDoUpdate({
              target: [badges.userId, badges.name],
              set: { score: sql`${badges.score} + 1`, lastUpdated: new Date() },
            });
          await this.pointsEarned(forUser, vote);
        }
      });
    } catch (error) {
      console.warn(error);
    }
  }

  async pointsEarned(userId: string, amount: number) {
    try {
      await this.db
        .insert(badges)
        .values({ userId, name: BADGE.POINTS_EARNED, score: amount, lastUpdated: new Date() })
        .onConflictDoUpdate({
          target: [badges.userId, badges.name],
          set: { score: sql`${badges.score} + ${amount}`, lastUpdated: new Date() },
        });
    } catch (error) {
      console.warn(error);
    }
  }
}
