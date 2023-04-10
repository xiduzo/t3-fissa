import { Fissa } from "@fissa/db";
import {
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
      where: { currentIndex: { gte: 0 } },
      select: {
        pin: true,
        expectedEndTime: true,
        currentIndex: true,
        shouldReorder: true,
      },
    });
  };

  create = async (tracks: { trackId: string; durationMs: number }[]) => {
    let fissa: Fissa | undefined = undefined;
    let tries = 0;
    const blockedPins: string[] = [];

    const tokens = this.db.account.findFirstOrThrow({
      where: { userId: this.ctx.session?.user.id },
      select: { access_token: true, refresh_token: true },
    });

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

    const { access_token } = await tokens;

    await this.spotifyService.playTrack(access_token!, tracks[0]!.trackId);

    return this.byId(fissa?.pin!);
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
      select: {
        lastPlayedIndex: true,
        userId: true,
        by: {
          select: {
            accounts: { select: { access_token: true }, take: 1 },
          },
        },
        tracks: {
          select: { trackId: true, durationMs: true },
          orderBy: { index: "asc" },
        },
      },
    });

    if (fissa.userId !== this.ctx.session?.user.id)
      throw new Error("Not authorized");

    const { access_token } = fissa.by.accounts[0]!;
    const track = fissa.tracks[fissa.lastPlayedIndex]!;

    await this.spotifyService.playTrack(access_token!, track.trackId);

    return this.db.fissa.update({
      where: { pin },
      data: {
        currentIndex: fissa.lastPlayedIndex,
        expectedEndTime: addMilliseconds(new Date(), track.durationMs),
      },
    });
  };

  playNextTrack = async (
    pin: string,
    currentIndex: number,
    instantPlay = false,
  ) => {
    const fissa = await this.getFissaDetailedInformation(pin);

    if (fissa.currentIndex !== currentIndex) return;

    const { access_token } = fissa.by.accounts[0]!;
    const { tracks } = fissa;

    try {
      const isPlaying = this.spotifyService.isStillPlaying(access_token!);

      const currentTrack = tracks[fissa.currentIndex]!;
      const nextIndex = fissa.currentIndex + 1;
      const nextTrack = tracks[nextIndex]!;

      const removeVotes = this.db.vote.deleteMany({
        where: {
          pin,
          trackId: { in: [currentTrack.trackId, nextTrack.trackId] },
        },
      });

      // Automatically add more tracks to the playlist
      if (nextIndex + 3 > tracks.length) {
        const trackIds = tracks
          .slice(nextIndex, tracks.length)
          .map(({ trackId }) => trackId);

        await this.trackService.addRecommendedTracks(
          pin,
          trackIds,
          tracks.length,
          access_token!,
        );
      }

      if (!(await isPlaying)) return this.stopFissa(pin);

      const playIn = differenceInMilliseconds(
        instantPlay ? new Date() : fissa.expectedEndTime,
        new Date(),
      );
      await new Promise((resolve) => setTimeout(resolve, playIn)); // Wait for track to end
        
      await this.spotifyService.playTrack(access_token!, nextTrack.trackId);
      
      await this.updateFissaIndexes(pin, currentIndex, nextTrack.durationMs);

      await removeVotes;
    } catch (e) {
      console.error(e);
      return this.stopFissa(pin);
    }
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
    currentIndex: number,
    durationMs: number,
  ) => {
    return this.db.fissa.update({
      where: { pin },
      data: {
        expectedEndTime: addMilliseconds(new Date(), durationMs),
        currentIndex: { increment: 1 },
        lastPlayedIndex: { increment: 1 },
        tracks: {
          updateMany: {
            where: { index: { in: [currentIndex, currentIndex + 1] } },
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
        by: {
          select: {
            accounts: { select: { access_token: true }, take: 1 },
          },
        },
        tracks: { orderBy: { index: "asc" } },
      },
    });
  };
}
