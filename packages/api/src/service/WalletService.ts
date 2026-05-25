import { usersInFissas, type DB } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import type { WalletRepository } from "../repository/WalletRepository";

/**
 * Spending side of the points economy (ADR-0001). Earning is eventual via the
 * outbox; spending is synchronous and floor-guarded. The Wallet aggregate owns
 * the `points >= 0` invariant — this service just loads it under a row lock,
 * runs the command, and saves, so concurrent spends can't race the floor.
 */
export class WalletService {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly db: DB,
  ) {}

  balance = async (pin: string, userId: string): Promise<number> => {
    const row = await this.db.query.usersInFissas.findFirst({
      where: and(eq(usersInFissas.pin, pin), eq(usersInFissas.userId, userId)),
      columns: { points: true },
    });
    return row?.points ?? 0;
  };

  /** Spend points; throws InsufficientPoints if the balance can't cover it. */
  spend = async (pin: string, userId: string, amount: number): Promise<number> => {
    return this.db.transaction(async (tx) => {
      const wallet = await this.walletRepo.withLock(pin, userId, tx);
      wallet.spend(amount);
      await this.walletRepo.save(wallet, tx);
      return wallet.balance;
    });
  };
}
