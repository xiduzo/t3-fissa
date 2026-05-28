import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DB } from "@fissa/db";
import { mock } from "@fissa/test";

import { InsufficientPoints, NotAMember, Wallet } from "../domain/Wallet";
import type { WalletRepository } from "../repository/WalletRepository";
import { WalletService } from "./WalletService";

/**
 * Spend is the synchronous, floor-guarded side of the points economy
 * (ADR-0001). Membership + balance both check under one row lock — these
 * cover the seam between the two so a non-member can't get an
 * `InsufficientPoints` response (which would leak that the pin exists).
 */
describe("WalletService.spend", () => {
  const walletRepo = mock<WalletRepository>();
  const db = mock<DB>();
  const tx = {} as never;

  beforeEach(() => {
    vi.clearAllMocks();
    db.transaction.mockImplementation((cb: (t: never) => unknown) =>
      Promise.resolve(cb(tx)),
    );
  });

  const service = () => new WalletService(walletRepo, db);

  it("debits the balance and saves on a happy spend", async () => {
    walletRepo.withLock.mockResolvedValueOnce(Wallet.load("AB12", "u1", 50));

    const balance = await service().spend("AB12", "u1", 10);

    expect(balance).toBe(40);
    expect(walletRepo.save).toHaveBeenCalledTimes(1);
    expect(walletRepo.save.mock.calls[0]![0].balance).toBe(40);
  });

  it("throws NotAMember when no membership row exists — never InsufficientPoints", async () => {
    walletRepo.withLock.mockResolvedValueOnce(null);

    await expect(service().spend("AB12", "u1", 1)).rejects.toBeInstanceOf(NotAMember);
    expect(walletRepo.save).not.toHaveBeenCalled();
  });

  it("throws InsufficientPoints when a member's balance is below the spend", async () => {
    walletRepo.withLock.mockResolvedValueOnce(Wallet.load("AB12", "u1", 3));

    await expect(service().spend("AB12", "u1", 10)).rejects.toBeInstanceOf(
      InsufficientPoints,
    );
    expect(walletRepo.save).not.toHaveBeenCalled();
  });
});
