import { type Fissa, type Track } from "@fissa/db";
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
  type SpotifyService,
} from "@fissa/utils";

import { ServiceWithContext, type Context } from "../utils/context";
import { EarnedPoints } from "../utils/EarnedPoints";

const TRACKS_BEFORE_ADDING_RECOMMENDATIONS = 3;

export class FissaService extends ServiceWithContext {
  constructor(ctx: Context, private readonly spotifyService: SpotifyService) {
    super(ctx);
  }

  activeFissas = async () => {
    return this.db.fissa.findMany({
      where: { currentlyPlayingId: { not: null } },
      select: { pin: true, expectedEndTime: true },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[], userId: string) => {
    if (!tracks[0]) throw new UnableToCreateFissa("No tracks");

    const { access_token } = await this.db.account.findFirstOrThrow({
      where: { userId },
      select: { access_token: true },
    });

    if (!access_token) throw new NotAbleToAccessSpotify();

    await this.db.fissa.deleteMany({ where: { userId } });

    let fissa: Fissa | undefined = undefined;
    let tries = 0;
    const triedPins: string[] = [];

    do {
      const pin = randomize("0", 4);

      if (triedPins.includes(pin)) continue;

      try {
        fissa = await this.db.fissa.create({
          data: {
            pin,
            expectedEndTime: addMilliseconds(new Date(), tracks[0].durationMs),
            by: { connect: { id: userId } },
            tracks: { createMany: { data: tracks.map((track) => ({ ...track, userId })) } },
          },
        });
      } catch (e) {
        tries++;
        triedPins.push(pin);
      }
    } while (!fissa && tries < 50);

    if (!fissa) throw new UnableToCreateFissa("No unique pin found");

    if (tracks.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
      await this.addRecommendedTracks(fissa.pin, tracks, access_token);
    }

    await this.playTrack(fissa, tracks[0], access_token);

    return fissa;
  };

  byId = async (pin: string, userId: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: { include: { by: { select: { email: true } } } },
      },
    });

    await this.db.userInFissa.upsert({
      where: { pin_userId: { pin, userId } },
      create: { pin, userId },
      update: {},
    });

    return fissa;
  };

  skipTrack = async (pin: string, userId: string) => {
    const fissa = await this.byId(pin, userId);

    if (fissa.userId !== userId) throw new NotTheHost();
    if (!fissa.currentlyPlayingId) throw new FissaIsPaused();

    await this.db.track.update({
      where: { pin_trackId: { pin, trackId: fissa.currentlyPlayingId } },
      data: { totalScore: { decrement: EarnedPoints.SkipTrack } },
    });

    return this.playNextTrack(pin, true);
  };

  restart = async (pin: string, userId: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: { userId: true },
    });

    if (fissa.userId !== userId) throw new NotTheHost();

    return this.playNextTrack(pin, true);
  };

  pause = async (pin: string, userId: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: { by: { include: { accounts: { select: { access_token: true } } } } },
    });

    if (fissa.userId !== userId) throw new NotTheHost();
    if (!fissa.by.accounts[0]?.access_token) throw new NotAbleToAccessSpotify();

    await this.stopFissa(pin, fissa.by.accounts[0]?.access_token);
  };

  playNextTrack = async (pin: string, forceToPlay = false) => {
    const { by, tracks, currentlyPlayingId, expectedEndTime } =
      await this.getFissaDetailedInformation(pin);

    if (!by.accounts[0]) throw new NotAbleToAccessSpotify();

    const { access_token } = by.accounts[0];
    if (!access_token) throw new NotAbleToAccessSpotify();

    try {
      if (!forceToPlay) {
        const isPlaying = await this.spotifyService.isStillPlaying(access_token);
        if (!isPlaying || !currentlyPlayingId) throw new ForceStopFissa();
      }

      const nextTracks = this.getNextTracks(tracks, currentlyPlayingId);
      if (!nextTracks[0]) throw new NoNextTrack();

      if (nextTracks.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
        await this.addRecommendedTracks(pin, biasSort(tracks), access_token);
      }

      const timeToPlay = forceToPlay ? new Date() : expectedEndTime;
      await sleep(differenceInMilliseconds(timeToPlay, new Date())); // Wait for track to end

      await this.trackPlayed({ pin, currentlyPlayingId });

      await this.playTrack({ pin }, nextTracks[0], access_token);
    } catch (e) {
      console.error(e);
      await this.stopFissa(pin, access_token);
    }
  };

  private stopFissa = async (pin: string, accessToken: string) => {
    try {
      await this.db.fissa.update({
        where: { pin },
        data: { currentlyPlaying: { disconnect: true } },
      });
      return this.spotifyService.pause(accessToken);
    } catch (e) {
      console.error(`${pin}, failed stopping fissa`, e);
    }
  };

  private getFissaDetailedInformation = async (pin: string) => {
    return await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: {
        pin: true,
        currentlyPlayingId: true,
        expectedEndTime: true,
        by: { select: { accounts: { select: { access_token: true }, take: 1 } } },
        tracks: { where: { hasBeenPlayed: false } },
      },
    });
  };

  private trackPlayed = async ({
    currentlyPlayingId,
    pin,
  }: Pick<Fissa, "currentlyPlayingId" | "pin">) => {
    if (!currentlyPlayingId) return;

    return this.db.$transaction(async (transaction) => {
      await transaction.track.update({
        where: { pin_trackId: { pin, trackId: currentlyPlayingId } },
        data: {
          hasBeenPlayed: true,
          score: 0, // Reset current score
          totalScore: { increment: EarnedPoints.PlayedTrack },
        },
      });

      await transaction.vote.deleteMany({
        where: { pin, trackId: currentlyPlayingId },
      });
    });
  };

  private playTrack = async (
    { pin }: Pick<Fissa, "pin">,
    { trackId, durationMs }: Pick<Track, "trackId" | "durationMs">,
    accessToken: string,
  ) => {
    const playing = this.spotifyService.playTrack(accessToken, trackId);

    await this.db.fissa.update({
      where: { pin },
      data: {
        currentlyPlaying: { connect: { pin_trackId: { pin, trackId } } },
        expectedEndTime: addMilliseconds(new Date(), durationMs),
      },
    });

    // TODO: We should ban this track from being played again
    //       as apparently it's not playable
    if (!(await playing)) return this.playNextTrack(pin, true);
  };

  private getNextTracks = (tracks: Track[], currentlyPlayingId?: string | null) => {
    const tracksToSort = tracks.filter(
      ({ hasBeenPlayed, trackId }) => !hasBeenPlayed && trackId !== currentlyPlayingId,
    );

    return sortFissaTracksOrder(tracksToSort);
  };

  private addRecommendedTracks = async (
    pin: string,
    tracks: { trackId: string }[],
    accessToken: string,
  ) => {
    try {
      const trackIds = tracks.map(({ trackId }) => trackId);
      const recommendations = await this.spotifyService.getRecommendedTracks(accessToken, trackIds);

      return this.db.fissa.update({
        where: { pin },
        data: {
          tracks: {
            createMany: {
              data: recommendations.map(({ id, duration_ms }) => ({
                trackId: id,
                durationMs: duration_ms,
                userId: this.ctx.session?.user.id,
              })),
              skipDuplicates: true,
            },
          },
        },
      });
    } catch (e) {
      console.error(`${pin}, failed adding recommended tracks`, e);
    }
  };
}
