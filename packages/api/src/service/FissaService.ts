import { type Fissa, type Track } from "@fissa/db";
import {
  addMilliseconds,
  differenceInMilliseconds,
  NoNextTrack,
  NotTheHost,
  randomize,
  randomSort,
  sortFissaTracksOrder,
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
      where: { currentlyPlaying: { isNot: undefined } },
      select: { pin: true, expectedEndTime: true },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    if (!this.ctx.session) throw new Error("No user session");

    const tokens = await this.db.account.findFirstOrThrow({
      where: { userId: this.ctx.session.user.id },
      select: { access_token: true, refresh_token: true },
    });

    const { access_token } = tokens;
    if (!access_token) throw new Error("No access token");
    if (!tracks[0]) throw new Error("No tracks");

    await this.db.fissa.deleteMany({
      where: { userId: this.ctx.session.user.id },
    });

    let fissa: Fissa | undefined = undefined;
    let tries = 0;
    const blockedPins: string[] = [];

    do {
      const pin = this.generatePin();

      if (blockedPins.includes(pin)) continue;

      try {
        fissa = await this.db.fissa.create({
          data: {
            pin,
            expectedEndTime: addMilliseconds(new Date(), tracks[0].durationMs),
            by: { connect: { id: this.ctx.session?.user.id } },
            tracks: {
              createMany: {
                data: tracks.map((track) => ({
                  ...track,
                  userId: this.ctx.session?.user.id ?? "", // TODO why this.ctx.session is possibly null again
                })),
              },
            },
          },
        });
      } catch (e) {
        console.log(e);
        tries++;
        blockedPins.push(pin);
      }
    } while (!fissa && tries < 50);

    if (!fissa) throw new Error("Failed to create fissa");

    await this.playTrack(fissa, tracks[0], access_token);

    if (tracks.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
      await this.addRecommendedTracks(
        fissa.pin,
        tracks.map(({ trackId }) => trackId),
        access_token,
      );
    }

    return fissa;
  };

  byId = async (pin: string) => {
    if (!this.ctx.session?.user) throw new Error("no user");
    const userId = this.ctx.session.user.id;

    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: {
          include: { by: { select: { email: true } } },
        },
      },
    });

    await this.db.userInFissa.upsert({
      where: { pin_userId: { pin, userId } },
      create: { pin, userId },
      update: {},
    });

    return fissa;
  };

  detailsById = async (pin: string) => {
    return this.db.fissa.findUnique({
      where: { pin },
      select: {
        by: { select: { email: true } },
        expectedEndTime: true,
        currentlyPlayingId: true,
      },
    });
  };

  skipTrack = async (pin: string) => {
    const fissa = await this.byId(pin);

    if (fissa.userId !== this.ctx.session?.user.id) throw new NotTheHost();

    if (!fissa.currentlyPlayingId) return;

    await this.db.track.update({
      where: { pin_trackId: { pin, trackId: fissa.currentlyPlayingId } },
      data: { totalScore: { decrement: EarnedPoints.SkipTrack } },
    });

    return this.playNextTrack(pin, true);
  };

  restart = async (pin: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: { userId: true },
    });

    if (fissa.userId !== this.ctx.session?.user.id) throw new NotTheHost();
    return this.playNextTrack(pin, true);
  };

  playNextTrack = async (pin: string, instantPlay = false) => {
    const fissa = await this.getFissaDetailedInformation(pin);

    if (!fissa.by.accounts[0]) throw new Error("No fissa found");
    const { access_token } = fissa.by.accounts[0];
    const { tracks, currentlyPlayingId } = fissa;

    if (!access_token) throw new Error("No access token");

    try {
      const isPlaying = await this.spotifyService.isStillPlaying(access_token);

      if (!instantPlay && !currentlyPlayingId) return;
      if (!instantPlay && !isPlaying) return this.stopFissa(pin);

      const expectedEndTime = instantPlay ? new Date() : fissa.expectedEndTime;
      const playIn = differenceInMilliseconds(expectedEndTime, new Date());

      const nextTracks = this.getNextTracks(tracks, currentlyPlayingId);

      if (!nextTracks?.length) return this.stopFissa(pin);
      const nextTrack = nextTracks[0];
      if (!nextTrack) throw new NoNextTrack();

      if (nextTracks.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
        const withPositiveScore = tracks.filter(({ totalScore }) => totalScore > 0);
        const tracksToMap = withPositiveScore.length ? withPositiveScore : tracks;

        const trackIds = tracksToMap
          .map(({ trackId }) => trackId)
          .sort(randomSort)
          .slice(0, TRACKS_BEFORE_ADDING_RECOMMENDATIONS);

        try {
          await this.addRecommendedTracks(pin, trackIds, access_token);
        } catch (e) {
          console.error(`${fissa.pin}, failed adding recommended tracks`, e);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, playIn)); // Wait for track to end

      await this.trackPlayed(fissa);
      await this.playTrack(fissa, nextTrack, access_token);
    } catch (e) {
      console.error(e);
      await this.stopFissa(pin);
      throw new Error("Something went wrong while playing the next track");
    }
  };

  private generatePin = () => randomize("0", 4);

  private stopFissa = async (pin: string) => {
    return this.db.fissa.update({
      where: { pin },
      data: { currentlyPlaying: { disconnect: true } },
    });
  };

  private getFissaDetailedInformation = async (pin: string) => {
    return await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: {
        pin: true,
        currentlyPlayingId: true,
        expectedEndTime: true,
        by: {
          select: { accounts: { select: { access_token: true }, take: 1 } },
        },
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
    await this.db.$transaction(async (transaction) => {
      // Update room to new track id currently playing
      await transaction.fissa.update({
        where: { pin },
        data: {
          currentlyPlaying: {
            connect: { pin_trackId: { pin, trackId } },
          },
          expectedEndTime: addMilliseconds(new Date(), durationMs),
        },
      });
    });

    await this.spotifyService.playTrack(accessToken, trackId);
  };

  private getNextTracks = (tracks: Track[], currentlyPlayingId?: string | null) => {
    const tracksToSort = tracks.filter(
      ({ hasBeenPlayed, trackId }) => !hasBeenPlayed && trackId !== currentlyPlayingId,
    );

    return sortFissaTracksOrder(tracksToSort);
  };

  private addRecommendedTracks = async (pin: string, trackIds: string[], accessToken: string) => {
    const recommendations = await this.spotifyService.getRecommendedTracks(accessToken, trackIds);

    return this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          createMany: {
            data: recommendations.map(({ id, duration_ms }) => ({
              trackId: id,
              durationMs: duration_ms,
              userId: this.ctx.session?.user?.id,
            })),
            skipDuplicates: true,
          },
        },
      },
    });
  };
}
