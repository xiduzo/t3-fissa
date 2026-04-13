import { addSeconds, differenceInMilliseconds } from "@fissa/utils";

import type { ActiveFissa } from "../interfaces";

export interface IFissaSyncCaller {
  getActiveFissas(): Promise<ActiveFissa[]>;
  playNextTrack(pin: string): Promise<Date | null>;
  refreshToken(pin: string): Promise<unknown>;
}

/**
 * Orchestrates background sync loops for active fissas.
 *
 * Normal path: event-driven. After each playNextTrack resolves with a new
 * expectedEndTime, the next track is scheduled immediately — no polling.
 *
 * Recovery: a light scan every RECOVERY_INTERVAL_MS catches any fissas that
 * lost their schedule (e.g. after a server restart).
 *
 * Near end-of-track: recursive halving fires validation checkpoints at
 * decreasing intervals so drift is caught early.
 */
export class FissaSyncOrchestrator {
  private readonly RECOVERY_INTERVAL_MS = 5 * 60 * 1000;
  private readonly TOKEN_REFRESH_INTERVAL_MS = 55_000;
  private readonly WIGGLE_S = 5;
  private readonly MIN_CHECK_DELAY_MS = 500;

  private readonly pendingTracks = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly caller: IFissaSyncCaller) {}

  async bootScan(): Promise<void> {
    try {
      const fissas = await this.caller.getActiveFissas();
      if (!fissas?.length) return;

      for (const fissa of fissas) {
        this.scheduleNextTrack(fissa);
      }
    } catch (err) {
      console.error("[sync] boot scan error", err);
    }
  }

  async recoveryScan(): Promise<void> {
    try {
      const fissas = await this.caller.getActiveFissas();
      if (!fissas?.length) return;

      for (const fissa of fissas) {
        if (this.pendingTracks.has(fissa.pin)) continue;

        console.warn(`[sync] ${fissa.pin} — recovered missing schedule`);
        this.scheduleNextTrack(fissa);
      }
    } catch (err) {
      console.error("[sync] recovery scan error", err);
    }
  }

  async syncTokens(): Promise<void> {
    try {
      const fissas = await this.caller.getActiveFissas();
      if (!fissas?.length) return;

      for (const fissa of fissas) {
        try {
          await this.caller.refreshToken(fissa.pin);
        } catch (err) {
          console.error(`[token] ${fissa.pin} refresh failed`, err);
        }
      }
    } catch (err) {
      console.error("[token] loop error", err);
    }
  }

  startIntervals(): () => void {
    void this.bootScan();
    void this.syncTokens();

    const recoveryInterval = setInterval(() => void this.recoveryScan(), this.RECOVERY_INTERVAL_MS);
    const tokenInterval = setInterval(() => void this.syncTokens(), this.TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(recoveryInterval);
      clearInterval(tokenInterval);
      for (const timeout of this.pendingTracks.values()) clearTimeout(timeout);
      this.pendingTracks.clear();
    };
  }

  private scheduleNextTrack(fissa: ActiveFissa): void {
    try {
      clearTimeout(this.pendingTracks.get(fissa.pin));

      const endTime = addSeconds(fissa.expectedEndTime, -this.WIGGLE_S);
      const delay = differenceInMilliseconds(endTime, new Date());

      if (delay <= this.MIN_CHECK_DELAY_MS) {
        this.pendingTracks.delete(fissa.pin);
        this.caller
          .playNextTrack(fissa.pin)
          .then((nextExpectedEndTime) => {
            if (!nextExpectedEndTime) return;
            this.scheduleNextTrack({ pin: fissa.pin, expectedEndTime: nextExpectedEndTime });
          })
          .catch((err: unknown) => console.error(`[sync] ${fissa.pin} failed`, err));
        return;
      }

      console.info(`[sync] ${fissa.pin} — next track in ${delay}ms`);

      this.pendingTracks.set(
        fissa.pin,
        setTimeout(() => this.scheduleNextTrack(fissa), delay / 2),
      );
    } catch (err) {
      console.error(`[sync] ${fissa.pin} error`, err);
    }
  }
}
