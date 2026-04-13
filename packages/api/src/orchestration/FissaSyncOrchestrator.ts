import { addSeconds, differenceInMilliseconds } from "@fissa/utils";

import type { ActiveFissa } from "../interfaces";

export interface IFissaSyncCaller {
  getActiveFissas(): Promise<ActiveFissa[]>;
  playNextTrack(pin: string): Promise<void>;
  refreshToken(pin: string): Promise<unknown>;
}

/**
 * Orchestrates background sync loops for active fissas.
 * Extracted from the server entry point so it can be tested independently.
 */
export class FissaSyncOrchestrator {
  private readonly SYNC_INTERVAL_MS = 55_000;
  private readonly WIGGLE_S = 5;
  private readonly MIN_CHECK_DELAY_MS = 500;

  constructor(private readonly caller: IFissaSyncCaller) {}

  async syncNextTracks(): Promise<void> {
    try {
      const fissas = await this.caller.getActiveFissas();
      if (!fissas?.length) return;

      for (const fissa of fissas) {
        this.scheduleNextTrack(fissa);
      }
    } catch (err) {
      console.error("[sync] loop error", err);
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
    void this.syncNextTracks();
    void this.syncTokens();

    const trackInterval = setInterval(() => void this.syncNextTracks(), this.SYNC_INTERVAL_MS);
    const tokenInterval = setInterval(() => void this.syncTokens(), this.SYNC_INTERVAL_MS);

    return () => {
      clearInterval(trackInterval);
      clearInterval(tokenInterval);
    };
  }

  private scheduleNextTrack(fissa: ActiveFissa): void {
    try {
      const endTime = addSeconds(fissa.expectedEndTime, -this.WIGGLE_S);
      const delay = differenceInMilliseconds(endTime, new Date());

      if (delay >= this.SYNC_INTERVAL_MS) return;

      if (delay <= this.MIN_CHECK_DELAY_MS) {
        this.caller
          .playNextTrack(fissa.pin)
          .catch((err: unknown) => console.error(`[sync] ${fissa.pin} failed`, err));
        return;
      }

      console.info(`[sync] ${fissa.pin} — next track in ${delay}ms`);

      setTimeout(() => this.scheduleNextTrack(fissa), delay / 2);
    } catch (err) {
      console.error(`[sync] ${fissa.pin} error`, err);
    }
  }
}
