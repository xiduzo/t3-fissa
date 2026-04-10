import { type Fissa, type Track, fissas, tracks, usersInFissas, votes, type DB } from "@fissa/db";
import {
  addMilliseconds,
  biasSort,
  differenceInMilliseconds,
  FissaIsPaused,
  ForceStopFissa,
  NoNextTrack,
  NotAbleToAccessSpotify,
  NotTheHost,
  randomize,
  sleep,
  sortFissaTracksOrder,
  UnableToCreateFissa,
} from "@fissa/utils";
import { and, eq, sql } from "drizzle-orm";
import type { Session } from "@fissa/auth";

import type { IBadgeService, IFissaRepository, ISpotifyService, ITrackRepository } from "../interfaces";
import { EarnedPoints } from "../utils/EarnedPoints";

export const TRACKS_BEFORE_ADDING_RECOMMENDATIONS = 3;

export class FissaService {
  constructor(
    private readonly fissaRepo: IFissaRepository,
    private readonly trackRepo: ITrackRepository,
    private readonly spotifyService: ISpotifyService,
    private readonly badgeService: IBadgeService,
    private readonly db: DB,
    private readonly session: Session | null,
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

    if (trackList.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
      await this.addRecommendedTracks(fissa.pin, trackList, account.accessToken);
    }

    await this.playTrack(fissa, trackList[0] as Track, account.accessToken);
    await this.badgeService.fissaCreated();

    return fissa;
  };

  byId = async (pin: string, userId?: string) => {
    const fissa = await this.fissaRepo.findByPinWithRelations(pin);

    if (!fissa) throw new Error(`Fissa not found: ${pin}`);

    if (userId) {
      await this.db
        .insert(usersInFissas)
        .values({ pin, userId })
        .onConflictDoNothing();
      await this.badgeService.joinedFissa(pin);
    }

    return fissa;
  };

  skipTrack = async (pin: string, userId: string) => {
    const fissa = await this.byId(pin, userId);

    if (fissa.userId !== userId) throw new NotTheHost();
    if (!fissa.currentlyPlayingId) throw new FissaIsPaused();

    const currentlyPlayingId = fissa.currentlyPlayingId;

    await this.db.transaction(async (tx) => {
      const [track] = await tx
        .update(tracks)
        .set({
          totalScore: sql`${tracks.totalScore} + ${EarnedPoints.SkipTrack}`,
          score: 0,
        })
        .where(and(eq(tracks.pin, pin), eq(tracks.trackId, currentlyPlayingId)))
        .returning();

      if (track?.userId) {
        await tx
          .update(usersInFissas)
          .set({ points: sql`${usersInFissas.points} + ${EarnedPoints.SkipTrack}` })
          .where(and(eq(usersInFissas.pin, pin), eq(usersInFissas.userId, track.userId)));
        await this.badgeService.pointsEarned(track.userId, EarnedPoints.SkipTrack);
      }
    });

    return this.playNextTrack(pin, true);
  };

  restart = async (pin: string, userId: string) => {
    const fissa = await this.fissaRepo.findByPin(pin);

    if (!fissa) throw new Error(`Fissa not found: ${pin}`);
    if (fissa.userId !== userId) throw new NotTheHost();

    return this.playNextTrack(pin, true);
  };

  pause = async (pin: string, userId: string) => {
    const fissa = await this.fissaRepo.findByPin(pin);
    if (!fissa) throw new Error(`Fissa not found: ${pin}`);
    if (fissa.userId !== userId) throw new NotTheHost();

    const ownerAccount = await this.fissaRepo.findOwnerAccount(pin);
    if (!ownerAccount?.accessToken) throw new NotAbleToAccessSpotify();

    await this.stopFissa(pin, ownerAccount.accessToken);
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

  playNextTrack = async (pin: string, forceToPlay = false) => {
    const fissaDetails = await this.fissaRepo.findDetailedForSync(pin);
    const { by, trackList: fissaTracks, currentlyPlaying, expectedEndTime } = fissaDetails;

    if (!by) throw new NotAbleToAccessSpotify();

    const { accessToken } = by;
    if (!accessToken) throw new NotAbleToAccessSpotify();

    try {
      if (!forceToPlay) {
        const isPlaying = await this.spotifyService.isStillPlaying(accessToken);
        if (!isPlaying || !currentlyPlaying?.trackId) throw new ForceStopFissa();
      }

      const [nextTrack, ...nextTracks] = this.getNextTracks(fissaTracks, currentlyPlaying?.trackId);
      if (!nextTrack) throw new NoNextTrack();

      if (nextTracks?.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
        await this.addRecommendedTracks(pin, biasSort(fissaTracks), accessToken);
      }

      const timeToPlay = forceToPlay ? new Date() : expectedEndTime;
      await sleep(differenceInMilliseconds(timeToPlay, new Date()));
      await this.playTrack({ pin }, nextTrack as Track, accessToken, currentlyPlaying);
    } catch (e) {
      console.error(e);
      await this.stopFissa(pin, accessToken);
    }
  };

  private stopFissa = async (pin: string, accessToken: string) => {
    try {
      await this.fissaRepo.clearCurrentlyPlaying(pin);
      return this.spotifyService.pause(accessToken);
    } catch (e) {
      console.error(`${pin}, failed stopping fissa`, e);
    }
  };

  private playTrack = async (
    { pin }: Pick<Fissa, "pin">,
    { trackId, durationMs }: Pick<Track, "trackId" | "durationMs">,
    accessToken: string,
    currentlyPlaying?: { trackId?: string; by?: { userId: string } },
  ) => {
    const playing = this.spotifyService.playTrack(accessToken, trackId);

    await this.db.transaction(async (tx) => {
      if (currentlyPlaying?.trackId) {
        await tx
          .update(tracks)
          .set({
            hasBeenPlayed: true,
            totalScore: sql`${tracks.totalScore} + ${EarnedPoints.PlayedTrack}`,
            score: 0,
          })
          .where(and(eq(tracks.pin, pin), eq(tracks.trackId, currentlyPlaying.trackId)));

        await tx
          .delete(votes)
          .where(and(eq(votes.pin, pin), eq(votes.trackId, currentlyPlaying.trackId)));

        if (currentlyPlaying.by) {
          await tx
            .update(usersInFissas)
            .set({ points: sql`${usersInFissas.points} + ${EarnedPoints.PlayedTrack}` })
            .where(
              and(
                eq(usersInFissas.pin, pin),
                eq(usersInFissas.userId, currentlyPlaying.by.userId),
              ),
            );
          await this.badgeService.pointsEarned(currentlyPlaying.by.userId, EarnedPoints.PlayedTrack);
        }
      }

      // Update currently playing inside the same transaction for atomicity
      await tx
        .update(fissas)
        .set({
          currentlyPlayingId: trackId,
          currentlyPlayingPin: pin,
          expectedEndTime: addMilliseconds(new Date(), durationMs),
        })
        .where(eq(fissas.pin, pin));
    });

    if (!(await playing)) {
      try {
        await this.trackRepo.delete(pin, trackId);
      } catch {
        console.warn("something went wrong deleting track", { pin, trackId });
      }

      return this.playNextTrack(pin, true);
    }
  };

  private getNextTracks = (
    trackList: Pick<Track, "hasBeenPlayed" | "trackId" | "score" | "lastUpdateAt" | "createdAt">[],
    currentlyPlayingId?: string | null,
  ) => {
    const tracksToSort = trackList.filter(
      ({ hasBeenPlayed, trackId }) => !hasBeenPlayed && trackId !== currentlyPlayingId,
    );
    return sortFissaTracksOrder(tracksToSort);
  };

  private addRecommendedTracks = async (
    pin: string,
    trackList: { trackId: string }[],
    accessToken: string,
  ) => {
    try {
      const trackIds = trackList.map(({ trackId }) => trackId);
      const recommendations = await this.spotifyService.getRecommendedTracks(accessToken, trackIds);

      await this.trackRepo.insertMany(
        recommendations.map(({ id, duration_ms }) => ({
          trackId: id,
          durationMs: duration_ms,
          userId: this.session?.user.id,
          pin,
        })),
      );
    } catch (e) {
      console.error(`${pin}, failed adding recommended tracks`, e);
    }
  };
}
