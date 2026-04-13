import type { Fissa, Track } from "@fissa/db";

export type FissaWithRelations = Fissa & {
  by: { email: string | null };
  tracks: (Track & { by: { email: string | null } })[];
};

export type FissaDetailedForSync = {
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
  currentlyPlaying:
    | {
        trackId: string | undefined;
        by: { userId: string } | undefined;
      }
    | undefined;
};

export type FissaOwnerAccount = {
  accessToken: string | null;
};

export type ActiveFissa = Pick<Fissa, "pin" | "expectedEndTime">;

export interface IFissaRepository {
  count(): Promise<number>;

  findActive(): Promise<ActiveFissa[]>;

  findByPin(pin: string): Promise<Fissa | undefined>;

  findByPinWithRelations(pin: string): Promise<FissaWithRelations | undefined>;

  findDetailedForSync(pin: string): Promise<FissaDetailedForSync>;

  findOwnerAccount(pin: string): Promise<FissaOwnerAccount | undefined>;

  create(pin: string, userId: string, expectedEndTime: Date): Promise<Fissa>;

  deleteByUserId(userId: string): Promise<void>;

  setCurrentlyPlaying(pin: string, trackId: string, expectedEndTime: Date): Promise<void>;

  clearCurrentlyPlaying(pin: string): Promise<void>;
}
