import { Fissa, Track } from "@fissa/db";
import {
  NoActiveDevice,
  NoNextTrack,
  NotTheHost,
  SpotifyService,
  addMilliseconds,
  differenceInMilliseconds,
  randomize,
} from "@fissa/utils";

import { Context, ServiceWithContext } from "../utils/context";
import { TrackService } from "./TrackService";

export class FissaService extends ServiceWithContext {
  private spotifyService: SpotifyService;
  private trackService: TrackService;

  constructor(
    ctx: Context,
    spotifyService?: SpotifyService,
    trackService?: TrackService,
  ) {
    super(ctx);
    this.spotifyService = spotifyService ?? new SpotifyService();
    this.trackService = trackService ?? new TrackService(ctx);
  }

  activeFissas = async () => {
    return this.db.fissa.findMany({
      where: { currentlyPlayingId: { not: undefined } },
      select: {
        pin: true,
        expectedEndTime: true,
        currentlyPlayingId: true,
        shouldReorder: true,
        tracks: true,
      },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    const tokens = await this.db.account.findFirstOrThrow({
      where: { userId: this.ctx.session?.user.id },
      select: { access_token: true, refresh_token: true },
    });

    const { access_token } = tokens;

    const device = await this.spotifyService.activeDevice(access_token!);

    if (!device) throw new NoActiveDevice();

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
            pin: pin as any as undefined,
            deviceId: device.id!,
            expectedEndTime: addMilliseconds(new Date(), tracks[0]!.durationMs),
            by: { connect: { id: this.ctx.session?.user.id } },
            tracks: {
              createMany: {
                data: tracks.map((track, index) => ({ ...track, index })),
              },
            },
          },
        });
      } catch (e) {
        tries++;
        blockedPins.push(pin);
      }
    } while (!fissa && tries < 50);

    await this.playTrack(fissa!, tracks[0]!, access_token!, true);

    return fissa!;
  };

  byId = async (pin: string) => {
    return this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: {
          select: { trackId: true, score: true },
          where: { hasBeenPlayed: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });
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

      if (!instantPlay && isPlaying) return this.stopFissa(pin);

      const expectedEndTime = instantPlay ? new Date() : fissa.expectedEndTime;
      const playIn = differenceInMilliseconds(expectedEndTime, new Date());

      const nextTrack = this.getNextTrack(tracks, currentlyPlayingId);

      if (!nextTrack) throw new NoNextTrack();

      await new Promise((resolve) => setTimeout(resolve, playIn)); // Wait for track to end

      await this.playTrack(fissa, nextTrack, access_token!);
    } catch (e) {
      console.error(e);
      return this.stopFissa(pin);
    }
  };

  private generatePin = () => randomize("0", 4);

  private stopFissa = async (pin: string) => {
    return this.db.fissa.update({
      where: { pin },
      data: { currentlyPlayingId: undefined },
    });
  };

  private getFissaDetailedInformation = async (pin: string) => {
    return await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: {
        pin: true,
        currentlyPlayingId: true,
        expectedEndTime: true,
        deviceId: true,
        by: {
          select: { accounts: { select: { access_token: true }, take: 1 } },
        },
        tracks: {
          orderBy: { createdAt: "asc" },
          where: { hasBeenPlayed: false },
        },
      },
    });
  };

  private playTrack = async (
    {
      currentlyPlayingId,
      pin,
      deviceId,
    }: Pick<Fissa, "currentlyPlayingId" | "pin" | "deviceId">,
    nextTrack: Pick<Track, "trackId" | "durationMs">,
    accessToken: string,
    /**
     * When the playlist is first created we do not want to skip the first track
     */
    initial = false,
  ) => {
    await this.db.$transaction(async (transaction) => {
      await transaction.vote.deleteMany({
        where: { pin, trackId: nextTrack.trackId },
      });

      if (currentlyPlayingId) {
        // update has been played on current track Id
        await transaction.track.update({
          where: { pin_trackId: { pin, trackId: currentlyPlayingId } },
          data: { hasBeenPlayed: true },
        });
      }

      // Update room to new track id currently playing
      await transaction.fissa.update({
        where: { pin },
        data: {
          currentlyPlayingId: nextTrack.trackId,
          expectedEndTime: addMilliseconds(new Date(), nextTrack.durationMs),
        },
      });
    });

    // play next track
    await this.spotifyService.playTrack(
      accessToken,
      nextTrack.trackId,
      deviceId,
    );

    // TODO automatically add more tracks to the playlist when needed
    // // Automatically add more tracks to the playlist
    // if (newIndex + 3 >= tracks.length) {
    //   const trackIds = tracks
    //     .slice(newIndex, tracks.length)
    //     .map(({ trackId }) => trackId);
    //   await this.trackService.addRecommendedTracks(
    //     pin,
    //     trackIds,
    //     tracks.length,
    //     accessToken,
    //   );
    // }
  };

  private getNextTrack = (
    tracks: Track[],
    currentlyPlayingId?: string | null,
  ) => {
    return tracks
      .filter(
        ({ hasBeenPlayed, trackId }) =>
          !hasBeenPlayed && trackId !== currentlyPlayingId,
      )
      .sort((a, b) => b.score - a.score)[0];
  };
}
