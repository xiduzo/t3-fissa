import type { DB } from "@fissa/db";

import type { BadgeProjection } from "../projection/BadgeProjection";
import type { OutboxRepository } from "../repository/OutboxRepository";
import type { WalletRepository } from "../repository/WalletRepository";

/**
 * Drains the transactional outbox into the eventual read models — the Wallet
 * (points balances) and the Badge projection (ADR-0001).
 *
 * Single worker, one event per transaction: the fold and the "mark processed"
 * commit together, so an event is applied exactly once even though delivery is
 * at-least-once. Earning points is what lags here; spending never waits on it.
 */
export class OutboxDrainer {
  private running = false;

  constructor(
    private readonly db: DB,
    private readonly outbox: OutboxRepository,
    private readonly wallet: WalletRepository,
    private readonly badges: BadgeProjection,
  ) {}

  /** Drain all currently-pending events. Returns how many were applied. */
  drain = async (batch = 100): Promise<number> => {
    if (this.running) return 0; // never overlap a single-threaded drainer
    this.running = true;
    let applied = 0;

    try {
      let pending = await this.outbox.pullUnprocessed(batch);
      while (pending.length) {
        for (const { id, event } of pending) {
          await this.db.transaction(async (tx) => {
            if (event.type === "PointsAwarded") {
              await this.wallet.credit(event.pin, event.userId, event.amount, tx);
            }
            await this.badges.apply(event, tx);
            await this.outbox.markProcessed([id], tx);
          });
          applied++;
        }
        pending = pending.length === batch ? await this.outbox.pullUnprocessed(batch) : [];
      }
    } catch (err) {
      console.error("[outbox] drain error", err);
    } finally {
      this.running = false;
    }

    return applied;
  };

  /** Start a periodic drain loop; returns a stop function. */
  startInterval(intervalMs = 2_000): () => void {
    void this.drain();
    const handle = setInterval(() => void this.drain(), intervalMs);
    return () => clearInterval(handle);
  }
}
