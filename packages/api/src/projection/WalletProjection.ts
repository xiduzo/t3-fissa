import type { DomainEvent } from "../domain/events";
import type { Executor } from "../interfaces";
import type { WalletRepository } from "../repository/WalletRepository";
import type { EventProjection } from "./EventProjection";

/**
 * Folds `PointsAwarded` into a guest's per-fissa Wallet balance. Sibling of
 * {@link BadgeProjection}: each owns its own event filter so the drainer stays
 * uniform across projections (ADR-0001 — earning is eventual). The Wallet
 * aggregate's `spend` floor invariant is unaffected; this is the credit side.
 */
export class WalletProjection implements EventProjection {
  constructor(private readonly wallet: WalletRepository) {}

  apply = async (event: DomainEvent, tx: Executor): Promise<void> => {
    if (event.type !== "PointsAwarded") return;
    await this.wallet.credit(event.pin, event.userId, event.amount, tx);
  };
}
