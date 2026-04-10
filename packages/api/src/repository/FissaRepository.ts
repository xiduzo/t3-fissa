import { fissas, tracks, usersInFissas, votes, type DB } from "@fissa/db";
import { count, eq, isNotNull } from "drizzle-orm";

import type { ActiveFissa, FissaDetailedForSync, FissaOwnerAccount, FissaWithRelations, IFissaRepository } from "../interfaces";
import type { Fissa } from "@fissa/db";

export class FissaRepository implements IFissaRepository {
  constructor(private readonly db: DB) {}

  count = async (): Promise<number> => {
    const result = await this.db.select({ count: count() }).from(fissas);
    return result[0]?.count ?? 0;
  };

  findActive = async (): Promise<ActiveFissa[]> => {
    return this.db.query.fissas.findMany({
      where: isNotNull(fissas.currentlyPlayingId),
      columns: { pin: true, expectedEndTime: true },
    });
  };

  findByPin = async (pin: string): Promise<Fissa | undefined> => {
    return this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
    });
  };

  findByPinWithRelations = async (pin: string): Promise<FissaWithRelations | undefined> => {
    return this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
      with: {
        by: { columns: { email: true } },
        tracks: { with: { by: { columns: { email: true } } } },
      },
    }) as Promise<FissaWithRelations | undefined>;
  };

  findDetailedForSync = async (pin: string): Promise<FissaDetailedForSync> => {
    const data = await this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
      columns: { pin: true, expectedEndTime: true },
      with: {
        currentlyPlaying: {
          columns: { trackId: true },
          with: {
            by: {
              columns: {},
              with: { accounts: { columns: { userId: true }, limit: 1 } },
            },
          },
        },
        by: {
          columns: {},
          with: { accounts: { columns: { accessToken: true, id: true }, limit: 1 } },
        },
        tracks: {
          where: (t, { eq }) => eq(t.hasBeenPlayed, false),
          columns: {
            userId: true,
            hasBeenPlayed: true,
            trackId: true,
            score: true,
            lastUpdateAt: true,
            totalScore: true,
            createdAt: true,
            durationMs: true,
          },
        },
      },
    });

    if (!data) throw new Error(`Fissa not found: ${pin}`);

    return {
      pin: data.pin,
      expectedEndTime: data.expectedEndTime,
      trackList: data.tracks,
      by: data.by.accounts[0],
      currentlyPlaying: data.currentlyPlaying
        ? {
            trackId: data.currentlyPlaying.trackId,
            by: data.currentlyPlaying.by?.accounts[0],
          }
        : undefined,
    };
  };

  findOwnerAccount = async (pin: string): Promise<FissaOwnerAccount | undefined> => {
    const data = await this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
      columns: {},
      with: {
        by: {
          columns: {},
          with: { accounts: { columns: { accessToken: true }, limit: 1 } },
        },
      },
    });

    const account = data?.by.accounts[0];
    if (!account) return undefined;
    return { accessToken: account.accessToken };
  };

  create = async (pin: string, userId: string, expectedEndTime: Date): Promise<Fissa> => {
    const [created] = await this.db
      .insert(fissas)
      .values({ pin, expectedEndTime, userId })
      .returning();

    if (!created) throw new Error("Failed to create fissa");
    return created;
  };

  deleteByUserId = async (userId: string): Promise<void> => {
    await this.db.delete(fissas).where(eq(fissas.userId, userId));
  };

  setCurrentlyPlaying = async (
    pin: string,
    trackId: string,
    expectedEndTime: Date,
  ): Promise<void> => {
    await this.db
      .update(fissas)
      .set({ currentlyPlayingId: trackId, currentlyPlayingPin: pin, expectedEndTime })
      .where(eq(fissas.pin, pin));
  };

  clearCurrentlyPlaying = async (pin: string): Promise<void> => {
    await this.db
      .update(fissas)
      .set({ currentlyPlayingId: null, currentlyPlayingPin: null })
      .where(eq(fissas.pin, pin));
  };
}
