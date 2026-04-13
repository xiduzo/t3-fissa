import { type z } from "zod";

import type { IBadgeService, ITrackRepository } from "../interfaces";
import { type Z_TRACKS } from "../router/constants";
import { type VoteService } from "./VoteService";

export class TrackService {
  constructor(
    private readonly trackRepo: ITrackRepository,
    private readonly voteService: VoteService,
    private readonly badgeService: IBadgeService,
  ) {}

  byPin = async (pin: string) => {
    return this.trackRepo.findByPin(pin);
  };

  addTracks = async (pin: string, trackList: z.infer<typeof Z_TRACKS>, userId: string) => {
    await this.trackRepo.insertMany(
      trackList.map((track) => ({ ...track, userId, pin })),
    );

    await this.badgeService.tracksAdded(trackList.length);

    const trackIds = trackList.map(({ trackId }) => trackId);
    return this.voteService.createVotes(pin, trackIds, 1, userId);
  };

  deleteTrack = async (pin: string, trackId: string) => {
    try {
      return await this.trackRepo.delete(pin, trackId);
    } catch {
      return Promise.resolve();
    }
  };
}
