import type { Fissa, Track } from "@fissa/db";

import type { Executor } from "./ITrackRepository";

export type FissaForDisplay = Fissa & {
  by: { email: string | null };
  tracks: (Track & { by: { email: string | null } })[];
};

export type FissaForSync = {
  pin: string;
  expectedEndTime: Date;
  trackList: Pick<
    Track,
    | "userId"
    | "hasBeenPlayed"
    | "trackId"
    | "score"
    | "lastUpdateAt"
    | "totalScore"
    | "createdAt"
    | "durationMs"
  >[];
  by: { accessToken: string | null; id: string } | undefined;
  /** Pointer only — commands load the full Track aggregate through ITrackRepository.load. */
  currentlyPlaying: { trackId: string | undefined } | undefined;
};

export type FissaOwnerAccount = {
  accessToken: string | null;
};

export type ActiveFissa = Pick<Fissa, "pin" | "expectedEndTime">;

/**
 * Reads are named by the consumer they serve, not the join structure: the
 * shape is the interface, the Drizzle joins are implementation. A new view
 * (e.g. notification feed, vote-count overlay) lands as another `findFor…`
 * method; adding columns to an existing view stays inside one query.
 */
export interface IFissaRepository {
  count(): Promise<number>;

  /** Active fissas only — used by the sync orchestrator's scans. */
  findActive(): Promise<ActiveFissa[]>;

  /** Bare aggregate row — used by owner-only commands (join/skip/restart/pause). */
  findByPin(pin: string): Promise<Fissa | undefined>;

  /** Display read for the guest-facing fissa page (members + queued tracks + emails). */
  findForDisplay(pin: string): Promise<FissaForDisplay | undefined>;

  /** Sync read for playback orchestration (unplayed tracks + host token + currently-playing owner). */
  findForSync(pin: string): Promise<FissaForSync>;

  /** Just the owner's Spotify access token — used when we only need to talk to Spotify. */
  findOwnerAccount(pin: string): Promise<FissaOwnerAccount | undefined>;

  create(pin: string, userId: string, expectedEndTime: Date): Promise<Fissa>;

  deleteByUserId(userId: string): Promise<void>;

  setCurrentlyPlaying(pin: string, trackId: string, expectedEndTime: Date, tx?: Executor): Promise<void>;

  clearCurrentlyPlaying(pin: string): Promise<void>;
}
