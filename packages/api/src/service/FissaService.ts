import { type Fissa, type Track, fissas, tracks, usersInFissas, votes } from "@fissa/db";
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
    subDays,
    UnableToCreateFissa,
    type SpotifyService,
} from "@fissa/utils";
import { and, count, eq, gte, isNotNull, sql } from "drizzle-orm";

import { ServiceWithContext, type Context } from "../utils/context";
import { EarnedPoints } from "../utils/EarnedPoints";
import { type BadgeService } from "./BadgeService";

export const TRACKS_BEFORE_ADDING_RECOMMENDATIONS = 3;

export class FissaService extends ServiceWithContext {
  constructor(ctx: Context, private readonly spotifyService: SpotifyService, private readonly badgeService: BadgeService) {
    super(ctx);
  }

  activeFissasCount = async () => {
    const result = await this.db
      .select({ count: count() })
      .from(fissas)
      .where(gte(fissas.lastUpdateAt, subDays(new Date(), 14)));
    return result[0]?.count ?? 0;
  };

  activeFissas = async () => {
    return this.db.query.fissas.findMany({
      where: isNotNull(fissas.currentlyPlayingId),
      columns: { pin: true, expectedEndTime: true },
    });
  };

  create = async (trackList: { trackId: string; durationMs: number }[], userId: string) => {
    if (!trackList[0]) throw new UnableToCreateFissa("No tracks");

    const account = await this.db.query.accounts.findFirst({
      where: (a, { eq }) => eq(a.userId, userId),
      columns: { accessToken: true },
    });

    if (!account?.accessToken) throw new NotAbleToAccessSpotify();

    await this.db.delete(fissas).where(eq(fissas.userId, userId));

    let fissa: Fissa | undefined = undefined;
    let tries = 0;
    const triedPins: string[] = [];

    do {
      const pin = randomize("0", 4);
      if (triedPins.includes(pin)) continue;

      try {
        const [created] = await this.db
          .insert(fissas)
          .values({
            pin,
            expectedEndTime: addMilliseconds(new Date(), trackList[0].durationMs),
            userId,
          })
          .returning();

        if (created) {
          await this.db
            .insert(tracks)
            .values(trackList.map((track) => ({ ...track, userId, pin })));
          fissa = created;
        }
      } catch {
        tries++;
        triedPins.push(pin);
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
    const fissa = await this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
      with: {
        by: { columns: { email: true } },
        tracks: { with: { by: { columns: { email: true } } } },
      },
    });

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
    const fissa = await this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
      columns: { userId: true },
    });

    if (!fissa) throw new Error(`Fissa not found: ${pin}`);
    if (fissa.userId !== userId) throw new NotTheHost();

    return this.playNextTrack(pin, true);
  };

  pause = async (pin: string, userId: string) => {
    const fissa = await this.db.query.fissas.findFirst({
      where: eq(fissas.pin, pin),
      columns: { userId: true },
      with: {
        by: {
          columns: {},
          with: { accounts: { columns: { accessToken: true }, limit: 1 } },
        },
      },
    });

    if (!fissa) throw new Error(`Fissa not found: ${pin}`);
    if (fissa.userId !== userId) throw new NotTheHost();
    if (!fissa.by.accounts[0]?.accessToken) throw new NotAbleToAccessSpotify();

    await this.stopFissa(pin, fissa.by.accounts[0].accessToken);
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
    const fissaDetails = await this.getFissaDetailedInformation(pin);
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
      await this.db
        .update(fissas)
        .set({ currentlyPlayingId: null, currentlyPlayingPin: null })
        .where(eq(fissas.pin, pin));
      return this.spotifyService.pause(accessToken);
    } catch (e) {
      console.error(`${pin}, failed stopping fissa`, e);
    }
  };

  private getFissaDetailedInformation = async (pin: string) => {
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
      ...data,
      trackList: data.tracks,
      by: data.by.accounts[0],
      currentlyPlaying: {
        ...data.currentlyPlaying,
        by: data.currentlyPlaying?.by?.accounts[0],
      },
    };
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
            .where(and(eq(usersInFissas.pin, pin), eq(usersInFissas.userId, currentlyPlaying.by.userId)));
          await this.badgeService.pointsEarned(currentlyPlaying.by.userId, EarnedPoints.PlayedTrack);
        }
      }

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
        await this.db
          .delete(tracks)
          .where(and(eq(tracks.pin, pin), eq(tracks.trackId, trackId)));
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

      await this.db
        .insert(tracks)
        .values(
          recommendations.map(({ id, duration_ms }) => ({
            trackId: id,
            durationMs: duration_ms,
            userId: this.session?.user.id,
            pin,
          })),
        )
        .onConflictDoNothing();
    } catch (e) {
      console.error(`${pin}, failed adding recommended tracks`, e);
    }
  };
}
