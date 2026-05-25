import type { DB } from "@fissa/db";
import { mock } from "@fissa/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { pointsAwarded, voteCast, type DomainEvent } from "../domain/events";
import type { BadgeProjection } from "../projection/BadgeProjection";
import type { OutboxRepository, StoredEvent } from "../repository/OutboxRepository";
import type { WalletRepository } from "../repository/WalletRepository";
import { OutboxDrainer } from "./OutboxDrainer";

describe("OutboxDrainer", () => {
  const outbox = mock<OutboxRepository>();
  const wallet = mock<WalletRepository>();
  const badges = mock<BadgeProjection>();
  const db = mock<DB>();

  // Run each db.transaction callback immediately with a throwaway tx.
  const tx = {} as never;
  beforeEach(() => {
    vi.clearAllMocks();
    db.transaction.mockImplementation((cb: (t: never) => unknown) => Promise.resolve(cb(tx)));
  });

  const drainer = () => new OutboxDrainer(db, outbox, wallet, badges);

  const stored = (event: DomainEvent): StoredEvent => ({ id: event.eventId, event });

  it("credits the Wallet and folds the badge for a PointsAwarded event, then marks it processed", async () => {
    const event = pointsAwarded({ pin: "AB12", userId: "u1", amount: 4, reason: "playReward" });
    outbox.pullUnprocessed.mockResolvedValueOnce([stored(event)]).mockResolvedValue([]);

    const applied = await drainer().drain();

    expect(applied).toBe(1);
    expect(wallet.credit).toHaveBeenCalledWith("AB12", "u1", 4, tx);
    expect(badges.apply).toHaveBeenCalledWith(event, tx);
    expect(outbox.markProcessed).toHaveBeenCalledWith([event.eventId], tx);
  });

  it("does not touch a Wallet for non-points events", async () => {
    const event = voteCast({ pin: "AB12", byUser: "u1", forUser: "u2", direction: 1 });
    outbox.pullUnprocessed.mockResolvedValueOnce([stored(event)]).mockResolvedValue([]);

    await drainer().drain();

    expect(wallet.credit).not.toHaveBeenCalled();
    expect(badges.apply).toHaveBeenCalledWith(event, tx);
    expect(outbox.markProcessed).toHaveBeenCalledWith([event.eventId], tx);
  });

  it("keeps pulling while a full batch comes back, then stops", async () => {
    const event = pointsAwarded({ pin: "AB12", userId: "u1", amount: 1, reason: "voteReceived" });
    outbox.pullUnprocessed
      .mockResolvedValueOnce([stored(event)]) // batch of 1 == limit
      .mockResolvedValueOnce([stored(event)])
      .mockResolvedValue([]);

    const applied = await drainer().drain(1);

    expect(applied).toBe(2);
    expect(outbox.pullUnprocessed).toHaveBeenCalledTimes(3);
  });

  it("never overlaps: a re-entrant drain while one is running is a no-op", async () => {
    const d = drainer();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const event = pointsAwarded({ pin: "AB12", userId: "u1", amount: 1, reason: "voteReceived" });
    outbox.pullUnprocessed.mockResolvedValueOnce([stored(event)]).mockResolvedValue([]);
    wallet.credit.mockImplementationOnce(async () => {
      await gate; // hold the first drain open
    });

    const first = d.drain();
    const second = await d.drain(); // should bail immediately
    expect(second).toBe(0);

    release();
    await first;
  });

  it("swallows errors and resets so the next drain can run", async () => {
    outbox.pullUnprocessed.mockRejectedValueOnce(new Error("db down"));
    const d = drainer();

    await expect(d.drain()).resolves.toBe(0);

    // running flag reset → a subsequent drain proceeds
    outbox.pullUnprocessed.mockResolvedValue([]);
    await expect(d.drain()).resolves.toBe(0);
  });
});
