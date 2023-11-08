import { type Fissa, type Track } from "@fissa/db";
import {
  NoNextTrack,
  NotTheHost,
  SpotifyService,
  addMilliseconds,
  differenceInMilliseconds,
  randomSort,
  randomize,
  sortFissaTracksOrder,
} from "@fissa/utils";

import { ServiceWithContext, type Context } from "../utils/context";
import { TrackService } from "./TrackService";

const TRACKS_BEFORE_ADDING_RECOMMENDATIONS = 3;

export class FissaService extends ServiceWithContext {
  private spotifyService: SpotifyService = new SpotifyService();
  private trackService: TrackService;

  constructor(ctx: Context, spotifyService?: SpotifyService, trackService?: TrackService) {
    super(ctx);
    this.spotifyService = spotifyService ?? new SpotifyService();
    this.trackService = trackService ?? new TrackService(ctx);
  }

  activeFissas = async () => {
    return this.db.fissa.findMany({
      where: { currentlyPlaying: { isNot: null } },
      select: { pin: true, expectedEndTime: true },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    const tokens = await this.db.account.findFirstOrThrow({
      where: { userId: this.ctx.session?.user.id },
      select: { access_token: true, refresh_token: true },
    });

    const { access_token } = tokens;

    await this.db.fissa.deleteMany({
      where: { userId: this.ctx.session?.user.id },
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
            expectedEndTime: addMilliseconds(new Date(), tracks[0]!.durationMs),
            by: { connect: { id: this.ctx.session?.user.id } },
            tracks: {
              createMany: {
                data: tracks.map((track) => ({
                  ...track,
                  userId: this.ctx.session?.user.id!,
                })),
              },
            },
          },
        });
      } catch (e) {
        console.info(e);
        tries++;
        blockedPins.push(pin);
      }
    } while (!fissa && tries < 50);

    await this.playTrack(fissa!, tracks[0]!, access_token!);

    if (tracks.length <= TRACKS_BEFORE_ADDING_RECOMMENDATIONS) {
      await this.trackService.addRecommendedTracks(
        fissa!.pin,
        tracks.map(({ trackId }) => trackId),
        access_token!,
      );
    }

    return fissa!;
  };

  byId = async (pin: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: {
          include: { by: { select: { email: true } } },
        },
      },
    });

    await this.db.user.update({
      where: { id: this.ctx.session?.user.id },
      data: { partOf: { connect: { pin } } },
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

    const { access_token } = fissa.by.accounts[0]!;
    const { tracks, currentlyPlayingId } = fissa;

    try {
      const isPlaying = await this.spotifyService.isStillPlaying(access_token!);

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
          await this.trackService.addRecommendedTracks(pin, trackIds, access_token!);
        } catch (e) {
          console.error(`${fissa.pin}, failed adding recommended tracks`, e);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, playIn)); // Wait for track to end

      await this.updateScores(fissa);
      await this.playTrack(fissa, nextTrack, access_token!);
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

  private updateScores = async ({
    currentlyPlayingId,
    pin,
  }: Pick<Fissa, "currentlyPlayingId" | "pin">) => {
    if (!currentlyPlayingId) return;

    await this.db.$transaction(async (transaction) => {
      const scores = await this.db.vote.findMany({
        where: { pin, trackId: currentlyPlayingId },
      });

      const increment = scores.reduce((acc, { vote }) => acc + vote, 0);

      await transaction.track.update({
        where: { pin_trackId: { pin, trackId: currentlyPlayingId } },
        data: {
          hasBeenPlayed: true,
          score: 0, // Reset current score
          totalScore: { increment }, // Update total score
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

    // play next track
    await this.spotifyService.playTrack(accessToken, trackId);
  };

  private getNextTracks = (tracks: Track[], currentlyPlayingId?: string | null) => {
    const tracksToSort = tracks.filter(
      ({ hasBeenPlayed, trackId }) => !hasBeenPlayed && trackId !== currentlyPlayingId,
    );

    return sortFissaTracksOrder(tracksToSort);
  };
}
