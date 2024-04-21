import { type z } from "zod";

import { type Z_TRACKS } from "../router/constants";
import { ServiceWithContext, type Context } from "../utils/context";
import { type VoteService } from "./VoteService";

export class TrackService extends ServiceWithContext {
  constructor(ctx: Context, private readonly voteService: VoteService) {
    super(ctx);
  }

  byPin = async (pin: string) => {
    return this.db.track.findMany({
      where: { pin },
      orderBy: { createdAt: "asc" },
    });
  };

  addTracks = async (pin: string, tracks: z.infer<typeof Z_TRACKS>, userId: string) => {
    const fissa = await this.db.fissa.findUniqueOrThrow({
      where: { pin },
      select: { tracks: { select: { trackId: true } } },
    });

    const fissaTrackIds = fissa.tracks.map(({ trackId }) => trackId);

    const newTracks = tracks.filter(({ trackId }) => !fissaTrackIds.includes(trackId));

    await this.db.fissa.update({
      where: { pin },
      data: {
        tracks: {
          createMany: {
            data: newTracks.map((track) => ({ ...track, userId })),
            skipDuplicates: true,
          },
        },
      },
    });

    const trackIds = tracks.map(({ trackId }) => trackId);

    return this.voteService.createVotes(pin, trackIds, 1, userId);
  };

  deleteTrack = async (pin: string, trackId: string) => {
    try {
      const track = await this.db.track.delete({
        where: { pin_trackId: { pin, trackId } },
      });
      return track
    } catch (error) {
      // If the track is not found, we can ignore the error
      // TODO: make a generic prisma error handler
      // https://www.prisma.io/docs/orm/reference/error-reference#prismaclientknownrequesterror
      return Promise.resolve()
    }
  };

  addTrackScore = async (pin: string, trackId: string, score: number) => {
    return this.db.track.update({
      where: { pin_trackId: { pin, trackId } },
      data: { score: { increment: score } },
    });
  };
}
