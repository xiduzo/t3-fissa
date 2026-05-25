import { type z } from "zod";

import type { ITrackRepository } from "../interfaces";
import type { OutboxRepository } from "../repository/OutboxRepository";
import { trackAdded } from "../domain/events";
import { type Z_TRACKS } from "../router/constants";
import { type VoteService } from "./VoteService";

export class TrackService {
  constructor(
    private readonly trackRepo: ITrackRepository,
    private readonly voteService: VoteService,
    private readonly outbox: OutboxRepository,
  ) {}

  byPin = async (pin: string) => {
    return this.trackRepo.findByPin(pin);
  };

  addTracks = async (pin: string, trackList: z.infer<typeof Z_TRACKS>, userId: string) => {
    await this.trackRepo.insertMany(
      trackList.map((track) => ({ ...track, userId, pin })),
    );

    await this.outbox.append([trackAdded({ pin, userId, count: trackList.length })]);

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
