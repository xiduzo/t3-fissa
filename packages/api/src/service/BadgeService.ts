import { BADGE, badges, fissas, type DB } from "@fissa/db";
import { differenceInHours } from "@fissa/utils";
import { and, eq, sql } from "drizzle-orm";
import type { Session } from "@fissa/auth";

import type { IBadgeRepository, IBadgeService, IFissaRepository } from "../interfaces";

export class BadgeService implements IBadgeService {
  constructor(
    private readonly badgeRepo: IBadgeRepository,
    private readonly fissaRepo: IFissaRepository,
    private readonly db: DB,
    private readonly session: Session | null,
  ) {}

  fissaCreated = async (): Promise<void> => {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      const point = await this.badgeRepo.findByUserAndName(userId, BADGE.FISSAS_CREATED);
      if (point && differenceInHours(point.lastUpdated, new Date()) < 24) return;
      await this.badgeRepo.upsertScore(userId, BADGE.FISSAS_CREATED, 1);
    } catch (error) {
      console.warn(error);
    }
  };

  joinedFissa = async (pin: string): Promise<void> => {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      const fissa = await this.fissaRepo.findByPin(pin);
      if (fissa?.userId === userId) return;

      const point = await this.badgeRepo.findByUserAndName(userId, BADGE.FISSAS_JOINED);
      if (point && differenceInHours(point.lastUpdated, new Date()) < 24) return;
      await this.badgeRepo.upsertScore(userId, BADGE.FISSAS_JOINED, 1);
    } catch (error) {
      console.warn(error);
    }
  };

  tracksAdded = async (amount: number): Promise<void> => {
    const userId = this.session?.user.id;
    if (!userId) return;

    try {
      await this.badgeRepo.upsertScore(userId, BADGE.TRACKS_ADDED, amount);
    } catch (error) {
      console.warn(error);
    }
  };

  voted = async (vote: number, forUser?: string | null): Promise<void> => {
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
  };

  pointsEarned = async (userId: string, amount: number): Promise<void> => {
    try {
      await this.badgeRepo.upsertScore(userId, BADGE.POINTS_EARNED, amount);
    } catch (error) {
      console.warn(error);
    }
  };
}
