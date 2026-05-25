import { outbox, type DB } from "@fissa/db";
import { asc, inArray, isNull } from "drizzle-orm";

import type { DomainEvent } from "../domain/events";

/** A drizzle database handle or an open transaction — both can build queries. */
type Executor = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];

export interface StoredEvent {
  id: string;
  event: DomainEvent;
}

/**
 * The transactional outbox (ADR-0001). Events are appended in the same
 * transaction as the state change that raised them; a single drainer reads the
 * unprocessed ones and marks them done. The event's own `eventId` is the row
 * key, so appending and draining are both idempotent.
 */
export class OutboxRepository {
  constructor(private readonly db: DB) {}

  append = async (events: DomainEvent[], tx: Executor = this.db): Promise<void> => {
    if (!events.length) return;
    await tx
      .insert(outbox)
      .values(
        events.map((event) => ({
          id: event.eventId,
          type: event.type,
          payload: event,
        })),
      )
      .onConflictDoNothing();
  };

  pullUnprocessed = async (limit = 100): Promise<StoredEvent[]> => {
    const rows = await this.db
      .select({ id: outbox.id, payload: outbox.payload })
      .from(outbox)
      .where(isNull(outbox.processedAt))
      .orderBy(asc(outbox.createdAt))
      .limit(limit);

    return rows.map((row) => ({ id: row.id, event: row.payload as DomainEvent }));
  };

  markProcessed = async (ids: string[], tx: Executor = this.db): Promise<void> => {
    if (!ids.length) return;
    await tx
      .update(outbox)
      .set({ processedAt: new Date() })
      .where(inArray(outbox.id, ids));
  };
}
