import { beforeEach, describe, expect, it, vi } from "vitest";

import { mock } from "@fissa/test";

import {
  fissaCreated,
  memberJoined,
  pointsAwarded,
  trackAdded,
  voteCast,
} from "../domain/events";
import type { WalletRepository } from "../repository/WalletRepository";
import { WalletProjection } from "./WalletProjection";

/**
 * The Wallet projection owns its event filter: `PointsAwarded` credits the
 * balance; every other event is silently ignored. The drainer never branches
 * on event.type for the Wallet — that knowledge lives here.
 */
describe("WalletProjection.apply", () => {
  const wallet = mock<WalletRepository>();
  const tx = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const project = () => new WalletProjection(wallet);

  it("credits the Wallet on PointsAwarded with pin + userId + amount", async () => {
    const event = pointsAwarded({ pin: "AB12", userId: "u1", amount: 3, reason: "playReward" });

    await project().apply(event, tx);

    expect(wallet.credit).toHaveBeenCalledWith("AB12", "u1", 3, tx);
  });

  it("passes a negative amount through (skip penalty); the floor only matters on spend", async () => {
    const event = pointsAwarded({ pin: "AB12", userId: "u1", amount: -5, reason: "skipPenalty" });

    await project().apply(event, tx);

    expect(wallet.credit).toHaveBeenCalledWith("AB12", "u1", -5, tx);
  });

  it.each([
    voteCast({ pin: "AB12", byUser: "u1", forUser: "u2", direction: 1 }),
    trackAdded({ pin: "AB12", userId: "u1", count: 2 }),
    fissaCreated({ pin: "AB12", userId: "u1" }),
    memberJoined({ pin: "AB12", userId: "u1" }),
  ])("ignores $type — only PointsAwarded reaches the Wallet", async (event) => {
    await project().apply(event, tx);

    expect(wallet.credit).not.toHaveBeenCalled();
  });
});
