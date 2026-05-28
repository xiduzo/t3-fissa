import type { DomainEvent } from "../domain/events";
import type { Executor } from "../interfaces";

/**
 * A read model the outbox drainer folds events into (ADR-0001). Each projection
 * decides which event types it cares about and what state to mutate — the
 * drainer is event-type-blind. Adding a new projection is one container line;
 * adding a new earn event reaches into one projection, never the drainer.
 *
 * Folds are called inside the drainer's transaction, so the projection's write
 * commits together with `markProcessed` — at-least-once delivery becomes
 * exactly-once application by construction.
 */
export interface EventProjection {
  apply(event: DomainEvent, tx: Executor): Promise<void>;
}
