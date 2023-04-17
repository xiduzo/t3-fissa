import { Fissa, Track } from "@fissa/db";
import { NoActiveDevice, NotTheHost, SpotifyService, Timer, addMilliseconds, differenceInMilliseconds, randomize } from "@fissa/utils";



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
      where: { currentIndex: { gte: 0 } },
      select: {
        pin: true,
        expectedEndTime: true,
        currentIndex: true,
        shouldReorder: true,
        tracks: true
      },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    let fissa: Fissa | undefined = undefined;
    let tries = 0;
    const blockedPins: string[] = [];

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

    do {
      const pin = this.generatePin();

      if (blockedPins.includes(pin)) continue;

      try {
        fissa = await this.db.fissa.create({
          data: {
            pin,
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

    await this.playTrack(fissa!, tracks, access_token!, true);

    return fissa!;
  };

  byId = async (pin: string) => {
    return this.db.fissa.findUniqueOrThrow({
      where: { pin },
      include: {
        by: { select: { email: true } },
        tracks: {
          select: { trackId: true, score: true },
          orderBy: { index: "asc" },
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
        currentIndex: true,
      },
    });
  };

  skipTrack = async (pin: string) => {
    const fissa = await this.byId(pin);

    if (fissa.userId !== this.ctx.session?.user.id) throw new NotTheHost();

    return this.playNextTrack(pin, fissa.currentIndex, true);
  };

  restart = async (pin: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: { lastPlayedIndex: true, userId: true },
    });

    if (fissa.userId !== this.ctx.session?.user.id) throw new NotTheHost();

    return this.playNextTrack(pin, fissa.lastPlayedIndex, true);
  };

  playNextTrack = async (
    pin: string,
    currentIndex: number,
    instantPlay = false,
  ) => {
    const fissa = await this.getFissaDetailedInformation(pin);

    if (fissa.currentIndex !== currentIndex) return;

    const { access_token } = fissa.by.accounts[0]!;
    const { tracks, deviceId } = fissa;

    try {
      const isPlaying = this.spotifyService.isStillPlaying(access_token!);

      if (!instantPlay && !(await isPlaying)) return this.stopFissa(pin);

      const playIn = differenceInMilliseconds(
        instantPlay ? new Date() : fissa.expectedEndTime,
        new Date(),
      );
      await new Promise((resolve) => setTimeout(resolve, playIn)); // Wait for track to end

      await this.playTrack(
        { pin, currentIndex, deviceId },
        tracks,
        access_token!,
      );
    } catch (e) {
      console.error(e);
      return this.stopFissa(pin);
    }
  };

  reorder = async (
    pin: string,
    newCurrentIndex: number,
    updates: { where: { trackId: string }; data: { index: number } }[],
  ) => {
    return this.db.$transaction(
      async (transaction) => {
        const timer = new Timer(
          `Reordering ${updates.length} tracks for fissa ${pin}`,
        );
        // (1) Clear out the indexes
        await transaction.fissa.update({
          where: { pin },
          data: {
            tracks: {
              updateMany: updates.map((update, index) => ({
                ...update,
                data: {
                  index: update.data.index + 10000 + index + 1,
                },
              })),
            },
          },
        });

        // (2) Set the correct indexes
        await transaction.fissa.update({
          where: { pin },
          data: {
            tracks: { updateMany: updates },
            currentIndex: newCurrentIndex,
            lastPlayedIndex: newCurrentIndex,
            shouldReorder: false,
          },
        });

        timer.duration();
      },
      {
        maxWait: 20 * 1000,
        timeout: 60 * 1000,
      },
    );
  };

  private generatePin = () => randomize("0", 4);

  private stopFissa = async (pin: string) => {
    return this.db.fissa.update({
      where: { pin },
      data: { currentIndex: -1 },
    });
  };

  private updateFissaIndexes = async (
    pin: string,
    newIndex: number,
    durationMs: number,
  ) => {
    return this.db.fissa.update({
      where: { pin },
      data: {
        expectedEndTime: addMilliseconds(new Date(), durationMs),
        currentIndex: newIndex,
        lastPlayedIndex: newIndex - 1,
        tracks: {
          updateMany: {
            where: { index: { lte: newIndex } },
            data: { score: 0 },
          },
        },
      },
    });
  };

  private getFissaDetailedInformation = async (pin: string) => {
    return await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: {
        currentIndex: true,
        expectedEndTime: true,
        deviceId: true,
        by: {
          select: {
            accounts: { select: { access_token: true }, take: 1 },
          },
        },
        tracks: { orderBy: { index: "asc" } },
      },
    });
  };

  private playTrack = async (
    {
      currentIndex,
      pin,
      deviceId,
    }: Pick<Fissa, "currentIndex" | "pin" | "deviceId">,
    tracks: { trackId: string; durationMs: number }[],
    accessToken: string,
    /**
     * When the playlist is first created we do not want to skip the first track
     */
    initial = false,
  ) => {
    const newIndex = currentIndex + (initial ? 0 : 1);

    const currentTrack = tracks[currentIndex]!;

    const { trackId, durationMs } = tracks[newIndex]!;
    const removeVotes = this.db.vote.deleteMany({
      where: {
        pin,
        trackId: { in: [currentTrack.trackId, trackId] },
      },
    });

    // See: https://community.spotify.com/t5/Spotify-for-Developers/Get-playlist-items-can-not-filter-out-tracks-which-are-unable-to/td-p/5537250
    await this.spotifyService.playTrack(accessToken, trackId, deviceId);

    await this.updateFissaIndexes(pin, newIndex, durationMs);
    await removeVotes;

    // Automatically add more tracks to the playlist
    if (newIndex + 3 >= tracks.length) {
      const trackIds = tracks
        .slice(newIndex, tracks.length)
        .map(({ trackId }) => trackId);

      await this.trackService.addRecommendedTracks(
        pin,
        trackIds,
        tracks.length,
        accessToken,
      );
    }
  };
}