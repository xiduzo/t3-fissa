import { usersInFissas, type DB } from "@fissa/db";
import { and, eq, sql } from "drizzle-orm";

import { Wallet } from "../domain/Wallet";

type Executor = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];

/**
 * Persistence for the Wallet aggregate, backed by `users_in_fissas.points`.
 *
 * `credit` is the eventual, additive path the outbox drainer uses — an atomic
 * upsert that is safe because the drainer is single-threaded and each event is
 * marked processed in the same transaction. `withLock` + `save` back the
 * transactional `spend`, where the floor invariant must hold against committed
 * state (ADR-0001).
 */
export class WalletRepository {
  constructor(private readonly db: DB) {}

  /** Additive credit (or penalty). Seeds a wallet at the starting 50 if absent. */
  credit = async (
    pin: string,
    userId: string,
    amount: number,
    tx: Executor = this.db,
  ): Promise<void> => {
    await tx
      .insert(usersInFissas)
      .values({ pin, userId, points: 50 + amount })
      .onConflictDoUpdate({
        target: [usersInFissas.pin, usersInFissas.userId],
        set: { points: sql`${usersInFissas.points} + ${amount}` },
      });
  };

  /**
   * Load the wallet with a row lock so a concurrent spend can't race the floor.
   * Returns `null` if the guest is not a member of this fissa (no row to lock)
   * — the caller distinguishes "non-member tried to spend" from "member with
   * zero balance" instead of letting the second one masquerade as the first.
   */
  withLock = async (pin: string, userId: string, tx: Executor): Promise<Wallet | null> => {
    const [row] = await tx
      .select({ points: usersInFissas.points })
      .from(usersInFissas)
      .where(and(eq(usersInFissas.pin, pin), eq(usersInFissas.userId, userId)))
      .for("update");

    if (!row) return null;
    return Wallet.load(pin, userId, row.points);
  };

  save = async (wallet: Wallet, tx: Executor): Promise<void> => {
    await tx
      .update(usersInFissas)
      .set({ points: wallet.balance })
      .where(
        and(eq(usersInFissas.pin, wallet.pin), eq(usersInFissas.userId, wallet.userId)),
      );
  };
}
