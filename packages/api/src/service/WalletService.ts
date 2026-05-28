import { usersInFissas, type DB } from "@fissa/db";
import { and, eq } from "drizzle-orm";

import { NotAMember } from "../domain/Wallet";
import type { WalletRepository } from "../repository/WalletRepository";

/**
 * Spending side of the points economy (ADR-0001). Earning is eventual via the
 * outbox; spending is synchronous and floor-guarded. The Wallet aggregate owns
 * the `points >= 0` invariant. This service is the seam where membership +
 * floor are both enforced under the same row lock, so a non-member's spend
 * fails with a clean {@link NotAMember} rather than masquerading as
 * {@link InsufficientPoints} (which would leak whether the pin exists).
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

  /**
   * Spend points. Throws {@link NotAMember} if the guest isn't in the fissa;
   * throws {@link InsufficientPoints} if the balance can't cover the spend.
   * Both checks run under the same row lock that the spend itself holds, so
   * a concurrent join or credit can't slip between them.
   */
  spend = async (pin: string, userId: string, amount: number): Promise<number> => {
    return this.db.transaction(async (tx) => {
      const wallet = await this.walletRepo.withLock(pin, userId, tx);
      if (!wallet) throw new NotAMember(pin, userId);
      wallet.spend(amount);
      await this.walletRepo.save(wallet, tx);
      return wallet.balance;
    });
  };
}
