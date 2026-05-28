import { type Fissa, type Track, tracks, usersInFissas, type DB } from "@fissa/db";
import {
  addMilliseconds,
  NotAbleToAccessSpotify,
  randomize,
  UnableToCreateFissa,
} from "@fissa/utils";
import { and, eq } from "drizzle-orm";

import type { IFissaRepository, ITrackRepository } from "../interfaces";
import type { OutboxRepository } from "../repository/OutboxRepository";
import { Fissa as FissaAggregate, type FissaOutcome } from "../domain/Fissa";
import { Track as TrackAggregate } from "../domain/Track";
import type { PlaybackService } from "./PlaybackService";

/**
 * Fissa lifecycle — the live listening party rooted at `pin` (CONTEXT.md): its
 * owner, member roster, and the lifecycle of the `currentlyPlaying` pointer.
 * Owner-only commands (skip, restart, pause) live here and ask {@link
 * PlaybackService} to actually advance or stop the music; this module never
 * touches Spotify or the queue directly.
 */
export class FissaService {
  constructor(
    private readonly fissaRepo: IFissaRepository,
    private readonly trackRepo: ITrackRepository,
    private readonly playback: PlaybackService,
    private readonly outbox: OutboxRepository,
    private readonly db: DB,
  ) {}

  activeFissasCount = async (): Promise<number> => {
    return this.fissaRepo.count();
  };

  activeFissas = async () => {
    return this.fissaRepo.findActive();
  };

  create = async (trackList: { trackId: string; durationMs: number }[], userId: string) => {
    if (!trackList[0]) throw new UnableToCreateFissa("No tracks");

    const account = await this.db.query.accounts.findFirst({
      where: (a, { eq }) => eq(a.userId, userId),
      columns: { accessToken: true },
    });

    if (!account?.accessToken) throw new NotAbleToAccessSpotify();

    await this.fissaRepo.deleteByUserId(userId);

    let fissa: Fissa | undefined = undefined;
    let tries = 0;
    const triedPins: string[] = [];

    do {
      const pin = randomize("0", 4);
      if (triedPins.includes(pin)) continue;

      try {
        fissa = await this.fissaRepo.create(
          pin,
          userId,
          addMilliseconds(new Date(), trackList[0].durationMs),
        );

        await this.trackRepo.insertMany(
          trackList.map((track) => ({ ...track, userId, pin })),
        );
      } catch {
        tries++;
        triedPins.push(pin);
        fissa = undefined;
      }
    } while (!fissa && tries < 50);

    if (!fissa) throw new UnableToCreateFissa("No unique pin found");

    await this.playback.startFirstTrack(
      fissa.pin,
      trackList[0] as Track,
      account.accessToken,
      trackList,
    );
    await this.outbox.append([FissaAggregate.created(fissa.pin, userId)]);

    return fissa;
  };

  byId = async (pin: string, userId?: string) => {
    const fissa = await this.fissaRepo.findForDisplay(pin);

    if (!fissa) throw new Error(`Fissa not found: ${pin}`);

    return fissa;
  };

  join = async (pin: string, userId: string) => {
    await this.db
      .insert(usersInFissas)
      .values({ pin, userId })
      .onConflictDoNothing();

    const fissa = await this.fissaRepo.findByPin(pin);
    if (!fissa) return;

    // The aggregate owns the "host isn't joining their own party" rule.
    const outcome = this.aggregate(fissa).join(userId);
    await this.carryOut(pin, outcome);
  };

  skipTrack = async (pin: string, userId: string) => {
    const fissa = await this.byId(pin, userId);

    // Guard the transition first: throws NotTheHost / FissaIsPaused.
    const outcome = this.aggregate(fissa).skip(userId);
    const currentlyPlayingId = fissa.currentlyPlayingId!; // non-null once skip() accepts

    await this.db.transaction(async (tx) => {
      const existing = await tx.query.tracks.findFirst({
        where: and(eq(tracks.pin, pin), eq(tracks.trackId, currentlyPlayingId)),
        columns: { userId: true, score: true },
      });
      if (!existing) return;

      // The Track owns the skip penalty and raises the PointsAwarded event;
      // the penalty is eventual, folded into the Wallet from the outbox (ADR-0001).
      const track = new TrackAggregate(pin, currentlyPlayingId, existing.userId ?? null, existing.score);
      await this.trackRepo.applyOutcome(track, track.skip(), tx);
    });

    return this.carryOut(pin, outcome);
  };

  restart = async (pin: string, userId: string) => {
    const fissa = await this.fissaRepo.findByPin(pin);
    if (!fissa) throw new Error(`Fissa not found: ${pin}`);

    const outcome = this.aggregate(fissa).restart(userId); // throws NotTheHost
    return this.carryOut(pin, outcome);
  };

  pause = async (pin: string, userId: string) => {
    const fissa = await this.fissaRepo.findByPin(pin);
    if (!fissa) throw new Error(`Fissa not found: ${pin}`);

    const outcome = this.aggregate(fissa).pause(userId); // throws NotTheHost

    const ownerAccount = await this.fissaRepo.findOwnerAccount(pin);
    if (!ownerAccount?.accessToken) throw new NotAbleToAccessSpotify();

    await this.carryOut(pin, outcome, ownerAccount.accessToken);
  };

  private aggregate = (fissa: { pin: string; userId: string; currentlyPlayingId: string | null }) =>
    new FissaAggregate(fissa.pin, fissa.userId, fissa.currentlyPlayingId);

  /**
   * Carry out a {@link FissaOutcome}: append the events it raised, then ask
   * Playback to act on the transition. Playback remains the sole writer of the
   * `currentlyPlaying` pointer (CONTEXT.md) — the aggregate only decided.
   */
  private carryOut = async (
    pin: string,
    outcome: FissaOutcome,
    accessToken?: string,
  ): Promise<Date | null> => {
    if (outcome.events.length) await this.outbox.append(outcome.events);

    switch (outcome.action) {
      case "advance":
        return this.playback.playNext(pin, true);
      case "stop":
        if (accessToken) await this.playback.stop(pin, accessToken);
        return null;
      case "none":
        return null;
    }
  };

  members = async (pin: string) => {
    return this.db.query.usersInFissas.findMany({
      where: eq(usersInFissas.pin, pin),
      columns: { points: true },
      with: {
        user: { columns: { id: true, name: true, image: true } },
      },
    });
  };
}
