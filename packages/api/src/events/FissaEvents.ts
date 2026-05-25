/**
 * In-process pub/sub for "a Fissa changed" signals (CONTEXT.md: the live
 * listening party rooted at `pin`). Mutations publish the pin they touched;
 * the `fissa.onUpdate` subscription fans those out to connected clients over
 * SSE so apps refresh instead of polling.
 *
 * Deliberately built on plain JS + `AbortSignal` (no `node:events`): this
 * module sits in the `AppRouter` type graph, which the React Native client
 * resolves — and RN's type environment has no Node builtins.
 *
 * Single-process only — same assumption the outbox drainer and orchestrator
 * already rely on (ADR-0001). If the server is ever sharded, swap this for a
 * Redis/Postgres LISTEN-NOTIFY transport behind the same interface.
 */
type Listener = (pin: string) => void;

class FissaEvents {
  private readonly listeners = new Set<Listener>();

  /** Signal that the Fissa at `pin` changed (queue, votes, or playback). */
  publish(pin: string): void {
    for (const listener of this.listeners) listener(pin);
  }

  /**
   * Async iterator of change signals for a single `pin`, closing when `signal`
   * aborts (client disconnect). Yields the pin on every relevant change.
   */
  async *subscribe(pin: string, signal: AbortSignal): AsyncGenerator<string> {
    const queue: string[] = [];
    let wake: (() => void) | null = null;

    const listener: Listener = (changed) => {
      if (changed !== pin) return;
      queue.push(changed);
      wake?.();
      wake = null;
    };
    const onAbort = () => {
      wake?.();
      wake = null;
    };

    this.listeners.add(listener);
    signal.addEventListener("abort", onAbort);

    try {
      while (!signal.aborted) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            wake = resolve;
          });
          continue;
        }
        const next = queue.shift()!;
        if (!signal.aborted) yield next;
      }
    } finally {
      this.listeners.delete(listener);
      signal.removeEventListener("abort", onAbort);
    }
  }
}

/** Process-wide singleton — see class docs for the sharding caveat. */
export const fissaEvents = new FissaEvents();
