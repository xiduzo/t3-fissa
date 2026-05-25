import { BADGE, type DB } from "@fissa/db";
import { mock } from "@fissa/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fissaCreated,
  pointsAwarded,
  trackAdded,
  voteCast,
} from "../domain/events";
import { BadgeProjection } from "./BadgeProjection";

/**
 * The projection issues drizzle insert/upsert chains; we don't assert SQL
 * shape, only *which* badge folds happen for each event. A tiny fluent stub
 * captures the badge name passed to each upsert via the inserted values.
 */
describe("BadgeProjection", () => {
  const db = mock<DB>();
  const inserted: { name: string; userId: string }[] = [];

  const insertChain = {
    values: (v: { name: string; userId: string }) => {
      inserted.push({ name: v.name, userId: v.userId });
      return { onConflictDoUpdate: () => Promise.resolve() };
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    inserted.length = 0;
    (db.insert as unknown) = vi.fn(() => insertChain);
  });

  const projection = () => new BadgeProjection(db);

  it("folds PointsAwarded into POINTS_EARNED for the earner", async () => {
    await projection().apply(
      pointsAwarded({ pin: "AB12", userId: "owner", amount: 4, reason: "playReward" }),
    );
    expect(inserted).toEqual([{ name: BADGE.POINTS_EARNED, userId: "owner" }]);
  });

  it("folds an upvote into cast-for-voter and received-for-owner", async () => {
    await projection().apply(
      voteCast({ pin: "AB12", byUser: "voter", forUser: "owner", direction: 1 }),
    );
    expect(inserted).toEqual([
      { name: BADGE.UP_VOTES_CAST, userId: "voter" },
      { name: BADGE.UP_VOTES_RECEIVED, userId: "owner" },
    ]);
  });

  it("counts a cast downvote but no received badge when voting on your own track", async () => {
    await projection().apply(
      voteCast({ pin: "AB12", byUser: "owner", forUser: "owner", direction: -1 }),
    );
    expect(inserted).toEqual([{ name: BADGE.DOWN_VOTES_CAST, userId: "owner" }]);
  });

  it("folds TrackAdded into TRACKS_ADDED", async () => {
    await projection().apply(trackAdded({ pin: "AB12", userId: "u1", count: 3 }));
    expect(inserted).toEqual([{ name: BADGE.TRACKS_ADDED, userId: "u1" }]);
  });

  describe("24h debounce on FissaCreated", () => {
    it("increments when there is no prior badge", async () => {
      db.query = { badges: { findFirst: vi.fn().mockResolvedValue(undefined) } } as never;
      await projection().apply(fissaCreated({ pin: "AB12", userId: "u1" }));
      expect(inserted).toEqual([{ name: BADGE.FISSAS_CREATED, userId: "u1" }]);
    });

    it("skips when the badge was updated within the last 24h", async () => {
      db.query = {
        badges: { findFirst: vi.fn().mockResolvedValue({ lastUpdated: new Date() }) },
      } as never;
      await projection().apply(fissaCreated({ pin: "AB12", userId: "u1" }));
      expect(inserted).toEqual([]);
    });
  });
});
