import type { BADGE, InferSelectModel, badges } from "@fissa/db";

export type Badge = InferSelectModel<typeof badges>;

export interface IBadgeRepository {
  findByUserAndName(userId: string, name: BADGE): Promise<Badge | undefined>;

  upsertScore(userId: string, name: BADGE, amount: number): Promise<void>;
}
