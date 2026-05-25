import { fissas, type Track, type DB } from "@fissa/db";
import {
  addMilliseconds,
  biasSort,
  differenceInMilliseconds,
  ForceStopFissa,
  NoNextTrack,
  NotAbleToAccessSpotify,
  sleep,
  sortFissaTracksOrder,
} from "@fissa/utils";
import { eq } from "drizzle-orm";
import type { Session } from "@fissa/auth";

import type { IFissaRepository, ISpotifyService, ITrackRepository } from "../interfaces";
import { Track as TrackAggregate } from "../domain/Track";

/** Once the upcoming queue falls to this many tracks, top it up with recommendations. */
export const TRACKS_BEFORE_ADDING_RECOMMENDATIONS = 3;

/**
 * Playback engine (see CONTEXT.md) — decides what plays next and when, drives
 * the Spotify player, keeps the queue topped up, and lets the played Track
 * reward its owner. It advances a Fissa's `currentlyPlaying` pointer; the Fissa
 * aggregate owns that pointer's lifecycle and the owner-only commands that call
 * in here. Holds no invariant of its own — every decision is a read/write
 * through repositories.
 */
export class PlaybackService {
  constructor(
    private readonly fissaRepo: IFissaRepository,
    private readonly trackRepo: ITrackRepository,
    private readonly spotifyService: ISpotifyService,
    private readonly db: DB,
    private readonly session: Session | null,
  ) {}

  /**
   * Start a freshly created Fissa on its first track, seeding recommendations
   * when the host queued only a handful. Used by Fissa lifecycle `create`.
   */
  startFirstTrack = async (
    pin: string,
    firstTrack: Pick<Track, "trackId" | "durationMs">,
    accessToken: string,
    seedTracks: { trackId: string }[],
  ): Promise<Date | null> => {
    if (seedTracks.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
      await this.addRecommendedTracks(pin, seedTracks, accessToken);
    }
    return this.playTrack(pin, firstTrack, accessToken);
  };

  /**
   * Advance the pointer to the highest-scored upcoming track and play it.
   * `forceToPlay` skips the "is Spotify still on this track" guard and the wait,
   * used by owner commands (skip/restart) and the first play; the background
   * sync loop calls it without force.
   */
  playNext = async (
    pin: string,
    forceToPlay = false,
    retriedRecommendations = false,
  ): Promise<Date | null> => {
    const { by, trackList: fissaTracks, currentlyPlaying, expectedEndTime } =
      await this.fissaRepo.findDetailedForSync(pin);

    if (!by?.accessToken) throw new NotAbleToAccessSpotify();
    const { accessToken } = by;

    try {
      if (!forceToPlay) {
        const isPlaying = await this.spotifyService.isStillPlaying(accessToken);
        if (!isPlaying || !currentlyPlaying?.trackId) throw new ForceStopFissa();
      }

      const [nextTrack, ...nextTracks] = this.getNextTracks(fissaTracks, currentlyPlaying?.trackId);

      if (!nextTrack) {
        if (!retriedRecommendations) {
          await this.addRecommendedTracks(pin, biasSort(fissaTracks), accessToken);
          return this.playNext(pin, forceToPlay, true);
        }
        throw new NoNextTrack();
      }

      if (nextTracks?.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
        await this.addRecommendedTracks(pin, biasSort(fissaTracks), accessToken);
      }

      // TODO(#2 follow-up): the final wait still blocks here; the background
      // sync loop already schedules near end-of-track, so this could move into
      // the orchestrator's seam. Left as-is to keep this a behaviour-preserving split.
      const timeToPlay = forceToPlay ? new Date() : expectedEndTime;
      await sleep(differenceInMilliseconds(timeToPlay, new Date()));
      return await this.playTrack(pin, nextTrack as Track, accessToken, currentlyPlaying);
    } catch (e) {
      console.error(e);
      await this.stop(pin, accessToken);
      return null;
    }
  };

  /** Stop the Fissa: clear the pointer and pause the Spotify player. */
  stop = async (pin: string, accessToken: string): Promise<void> => {
    try {
      await this.fissaRepo.clearCurrentlyPlaying(pin);
      await this.spotifyService.pause(accessToken);
    } catch (e) {
      console.error(`${pin}, failed stopping fissa`, e);
    }
  };

  private playTrack = async (
    pin: string,
    { trackId, durationMs }: Pick<Track, "trackId" | "durationMs">,
    accessToken: string,
    currentlyPlaying?: { trackId?: string; score?: number; by?: { userId: string } },
  ): Promise<Date | null> => {
    const playing = this.spotifyService.playTrack(accessToken, trackId);
    const newExpectedEndTime = addMilliseconds(new Date(), durationMs);

    await this.db.transaction(async (tx) => {
      if (currentlyPlaying?.trackId) {
        // The Track owns the crowd-driven play reward (its net vote score) and
        // raises the PointsAwarded event; the reward is eventual, folded into
        // the Wallet from the outbox (ADR-0001). applyOutcome resets the score,
        // marks it played, clears its votes, and appends the event in this tx.
        const track = new TrackAggregate(
          pin,
          currentlyPlaying.trackId,
          currentlyPlaying.by?.userId ?? null,
          currentlyPlaying.score ?? 0,
        );
        await this.trackRepo.applyOutcome(track, track.play(), tx);
      }

      await tx
        .update(fissas)
        .set({
          currentlyPlayingId: trackId,
          currentlyPlayingPin: pin,
          expectedEndTime: newExpectedEndTime,
        })
        .where(eq(fissas.pin, pin));
    });

    if (!(await playing)) {
      try {
        await this.trackRepo.delete(pin, trackId);
      } catch {
        console.warn("something went wrong deleting track", { pin, trackId });
      }

      return this.playNext(pin, true);
    }

    return newExpectedEndTime;
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
