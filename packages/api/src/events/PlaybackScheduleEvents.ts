/**
 * In-process pub/sub for "this Fissa just advanced and now plays until X".
 * Mutations that move the `currentlyPlaying` pointer publish the new
 * expectedEndTime; the FissaSyncOrchestrator subscribes and arms its
 * end-of-track timer immediately, without waiting for the 5-min recovery scan.
 *
 * Single-process only — same caveat as FissaEvents (ADR-0001).
 */
type ScheduleListener = (pin: string, expectedEndTime: Date) => void;

class PlaybackScheduleEvents {
  private readonly listeners = new Set<ScheduleListener>();

  publish(pin: string, expectedEndTime: Date | null | undefined): void {
    if (!expectedEndTime) return;
    for (const listener of this.listeners) listener(pin, expectedEndTime);
  }

  subscribe(listener: ScheduleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const playbackScheduleEvents = new PlaybackScheduleEvents();
