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
import { type BadgeService } from "./BadgeService";

export const TRACKS_BEFORE_ADDING_RECOMMENDATIONS = 3;

export class FissaService extends ServiceWithContext {
  constructor(ctx: Context, private readonly spotifyService: SpotifyService, private readonly badgeService: BadgeService) {
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
    await this.badgeService.fissaCreated()

    return fissa;
  };

  byId = async (pin: string, userId?: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: { include: { by: { select: { email: true } } } },
      },
    });

    if (userId) {
      await this.db.userInFissa.upsert({
        where: { pin_userId: { pin, userId } },
        create: { pin, userId },
        update: {},
      });
      await this.badgeService.joinedFissa(pin)
    }

    return fissa;
  };

  skipTrack = async (pin: string, userId: string) => {
    await this.db.$transaction(async transaction => {
      const fissa = await this.byId(pin, userId);

      if (fissa.userId !== userId) throw new NotTheHost();
      if (!fissa.currentlyPlayingId) throw new FissaIsPaused();

      const track = await transaction.track.update({
        where: { pin_trackId: { pin, trackId: fissa.currentlyPlayingId } },
        data: { totalScore: { increment: EarnedPoints.SkipTrack }, score: 0 },
      })

      if (track.userId) {
        await transaction.userInFissa.update({
          where: { pin_userId: { pin, userId: track.userId } },
          data: { points: { increment: EarnedPoints.SkipTrack } },
        })
        await this.badgeService.pointsEarned(track.userId, EarnedPoints.SkipTrack)
      }
    })

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

    await this.stopFissa(pin, fissa.by.accounts[0].access_token);
  };

  members = async (pin: string) => {
    return this.db.userInFissa.findMany({
      where: { pin },
      select: {
        points: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
    });
  }

  playNextTrack = async (pin: string, forceToPlay = false) => {
    const fissaDetails = await this.getFissaDetailedInformation(pin);
    const { by, tracks, currentlyPlaying, expectedEndTime } = fissaDetails;

    if (!by) throw new NotAbleToAccessSpotify();

    const { access_token } = by;
    if (!access_token) throw new NotAbleToAccessSpotify();

    try {
      if (!forceToPlay) {
        const isPlaying = await this.spotifyService.isStillPlaying(access_token);
        if (!isPlaying || !currentlyPlaying?.trackId) throw new ForceStopFissa();
      }

      const [nextTrack, ...nextTracks] = this.getNextTracks(tracks, currentlyPlaying?.trackId);
      if (!nextTrack) throw new NoNextTrack();

      if (nextTracks?.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
        await this.addRecommendedTracks(pin, biasSort(tracks), access_token);
      }

      const timeToPlay = forceToPlay ? new Date() : expectedEndTime;
      await sleep(differenceInMilliseconds(timeToPlay, new Date())); // Wait for track to end
      await this.playTrack({ pin }, nextTrack as Track, access_token, currentlyPlaying);
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
    const data = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: {
        pin: true,
        currentlyPlaying: {
          select: {
            trackId: true,
            by: { select: { accounts: { select: { userId: true }, take: 1 } } },
          }
        },
        expectedEndTime: true,
        by: { select: { accounts: { select: { access_token: true, id: true }, take: 1 } } },
        tracks: {
          where: { hasBeenPlayed: false },
          select: {
            userId: true,
            hasBeenPlayed: true,
            trackId: true,
            score: true,
            lastUpdateAt: true,
            totalScore: true,
            createdAt: true,
            durationMs: true,
          }
        },
      },
    });

    return {
      ...data,
      by: data.by.accounts[0],
      currentlyPlaying: {
        ...data.currentlyPlaying,
        by: data.currentlyPlaying?.by?.accounts[0],
      }
    }
  };

  private playTrack = async (
    { pin }: Pick<Fissa, "pin">,
    { trackId, durationMs }: Pick<Track, "trackId" | "durationMs">,
    accessToken: string,
    currentlyPlaying?: { trackId?: string, by?: { userId: string } },
  ) => {
    const playing = this.spotifyService.playTrack(accessToken, trackId);

    await this.db.$transaction(async transaction => {
      if (currentlyPlaying?.trackId) {
        await transaction.track.update({
          where: { pin_trackId: { pin, trackId: currentlyPlaying?.trackId } },
          data: { hasBeenPlayed: true, totalScore: { increment: EarnedPoints.PlayedTrack }, score: 0 },
        });

        await transaction.vote.deleteMany({
          where: { pin, trackId: currentlyPlaying.trackId },
        });

        if (currentlyPlaying.by) {
          await transaction.userInFissa.update({
            where: { pin_userId: { pin, userId: currentlyPlaying.by.userId } },
            data: { points: { increment: EarnedPoints.PlayedTrack } }
          })
          await this.badgeService.pointsEarned(currentlyPlaying.by.userId, EarnedPoints.PlayedTrack)
        }
      }

      await transaction.fissa.update({
        where: { pin },
        data: {
          currentlyPlaying: { connect: { pin_trackId: { pin, trackId } } },
          expectedEndTime: addMilliseconds(new Date(), durationMs),
        },
      });
    })


    if (!(await playing)) {
      // We wanted to play a track but something went wrong
      // Most likely the track is not available in the country
      await this.db.track.delete({
        where: { pin_trackId: { pin, trackId } },
      })
      // TODO: we should notifiy the Fissa about deletion of this track?
      return this.playNextTrack(pin, true);
    }
  };

  private getNextTracks = (tracks: Pick<Track, 'hasBeenPlayed' | 'trackId' | 'score' | 'lastUpdateAt' | 'createdAt'>[], currentlyPlayingId?: string | null) => {
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
                userId: this.session?.user.id,
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
