import type { DB } from "@fissa/db";

import type { EventProjection } from "../projection/EventProjection";
import type { OutboxRepository } from "../repository/OutboxRepository";

/**
 * Drains the transactional outbox into every registered {@link EventProjection}
 * (ADR-0001 — Wallet credits, Badge counts).
 *
 * Single worker, one event per transaction: every projection's fold and the
 * "mark processed" commit together, so an event is applied exactly once even
 * though delivery is at-least-once. The drainer is event-type-blind; each
 * projection owns its own filter. Earning points lags here; spending never
 * waits on it.
 */
export class OutboxDrainer {
  private running = false;

  constructor(
    private readonly db: DB,
    private readonly outbox: OutboxRepository,
    private readonly projections: EventProjection[],
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
            for (const projection of this.projections) {
              await projection.apply(event, tx);
            }
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
