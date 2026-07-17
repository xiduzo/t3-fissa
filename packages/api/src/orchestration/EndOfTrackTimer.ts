import { addSeconds, differenceInMilliseconds } from "@fissa/utils";

import type { ActiveFissa } from "../interfaces";

export interface EndOfTrackCaller {
  /** Advance the fissa to its next track; resolves with the new `expectedEndTime`, or `null` if the queue is empty. */
  playNextTrack(pin: string): Promise<Date | null>;
}

/**
 * Per-fissa end-of-track scheduler. Owns one `setTimeout` per active fissa and
 * the recursive-halving discipline that lets it close in on the true end of a
 * track without polling:
 *
 *   delay/2, then delay/4 of what's left, ... until ≤ {@link MIN_CHECK_DELAY_MS}
 *   then call {@link EndOfTrackCaller.playNextTrack} and re-arm on the next
 *   `expectedEndTime`.
 *
 * Extracted from the broader sync orchestrator so the halving algorithm can be
 * tested with a fake clock without standing up cron loops or token refreshers.
 */
export class EndOfTrackTimer {
  /** End-of-track guard: we'd rather fire a hair early than a hair late. */
  readonly WIGGLE_S = 5;
  readonly MIN_CHECK_DELAY_MS = 500;

  private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();
  /**
   * Monotonic arm counter per pin. Each `arm` starts a new generation; the
   * halving recursion and the async re-arm after `playNextTrack` both carry
   * theirs and die silently once a newer arm supersedes them. Without this, a
   * skip/restart that moves `expectedEndTime` while an advance is in flight
   * gets overwritten by the stale re-arm (last-writer-wins).
   */
  private readonly generation = new Map<string, number>();

  constructor(private readonly caller: EndOfTrackCaller) {}

  /** Arm (or re-arm) the timer for a fissa whose pointer just moved. */
  arm(fissa: ActiveFissa): void {
    const gen = (this.generation.get(fissa.pin) ?? 0) + 1;
    this.generation.set(fissa.pin, gen);
    this.armAt(fissa, gen);
  }

  private armAt(fissa: ActiveFissa, gen: number): void {
    try {
      if (this.generation.get(fissa.pin) !== gen) return; // superseded by a newer arm

      clearTimeout(this.pending.get(fissa.pin));

      const endTime = addSeconds(fissa.expectedEndTime, -this.WIGGLE_S);
      const delay = differenceInMilliseconds(endTime, new Date());

      if (delay <= this.MIN_CHECK_DELAY_MS) {
        this.pending.delete(fissa.pin);
        this.caller
          .playNextTrack(fissa.pin)
          .then((nextExpectedEndTime) => {
            if (!nextExpectedEndTime) return;
            if (this.generation.get(fissa.pin) !== gen) return; // superseded while advancing
            this.arm({ pin: fissa.pin, expectedEndTime: nextExpectedEndTime });
          })
          .catch((err: unknown) => console.error(`[sync] ${fissa.pin} failed`, err));
        return;
      }

      console.info(`[sync] ${fissa.pin} — next track in ${delay}ms`);

      this.pending.set(
        fissa.pin,
        setTimeout(() => this.armAt(fissa, gen), delay / 2),
      );
    } catch (err) {
      console.error(`[sync] ${fissa.pin} error`, err);
    }
  }

  /** Is this fissa currently armed? Used by the recovery scan. */
  isArmed(pin: string): boolean {
    return this.pending.has(pin);
  }

  /** Cancel every pending timer. Used at shutdown. */
  cancelAll(): void {
    for (const timeout of this.pending.values()) clearTimeout(timeout);
    this.pending.clear();
    this.generation.clear();
  }
}
