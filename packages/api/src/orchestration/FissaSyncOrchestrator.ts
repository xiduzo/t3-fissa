import { playbackScheduleEvents } from "../events/PlaybackScheduleEvents";
import type { ActiveFissa } from "../interfaces";
import { EndOfTrackTimer, type EndOfTrackCaller } from "./EndOfTrackTimer";

export interface IFissaSyncCaller extends EndOfTrackCaller {
  getActiveFissas(): Promise<ActiveFissa[]>;
  refreshToken(pin: string): Promise<unknown>;
}

/**
 * Orchestrates background work for active fissas.
 *
 * - **End-of-track**: event-driven. After each playNextTrack resolves with a
 *   new expectedEndTime, {@link EndOfTrackTimer} arms a recursive halving
 *   timer — no polling.
 * - **Recovery**: a light scan every RECOVERY_INTERVAL_MS catches any fissa
 *   that lost its schedule (e.g. after a server restart).
 * - **Token refresh**: every TOKEN_REFRESH_INTERVAL_MS, refresh each active
 *   fissa's Spotify access token before it expires.
 *
 * The novel halving algorithm lives in EndOfTrackTimer where it can be tested
 * with a fake clock; the cron scans here are trivial setInterval loops.
 */
export class FissaSyncOrchestrator {
  private readonly RECOVERY_INTERVAL_MS = 5 * 60 * 1000;
  private readonly TOKEN_REFRESH_INTERVAL_MS = 55_000;

  private readonly timer: EndOfTrackTimer;

  constructor(private readonly caller: IFissaSyncCaller) {
    this.timer = new EndOfTrackTimer(caller);
  }

  async bootScan(): Promise<void> {
    try {
      const fissas = await this.caller.getActiveFissas();
      if (!fissas?.length) return;

      for (const fissa of fissas) {
        this.timer.arm(fissa);
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
        if (this.timer.isArmed(fissa.pin)) continue;

        console.warn(`[sync] ${fissa.pin} — recovered missing schedule`);
        this.timer.arm(fissa);
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
    const unsubscribe = playbackScheduleEvents.subscribe((pin, expectedEndTime) =>
      this.timer.arm({ pin, expectedEndTime }),
    );

    return () => {
      clearInterval(recoveryInterval);
      clearInterval(tokenInterval);
      unsubscribe();
      this.timer.cancelAll();
    };
  }
}
