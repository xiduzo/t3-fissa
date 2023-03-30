import { z } from "zod";
import { VOTE } from "@fissa/db";

import { Z_TRACKS } from "../router/constants";
import { ServiceWithContext } from "../utils/context";
import { RoomService } from "./RoomService";
import { VoteService } from "./VoteService";

export class TrackService extends ServiceWithContext {
  byPin = async (pin: string) => {
    return this.db.track.findMany({
      where: { pin },
      orderBy: { index: "asc" },
    });
  };

  addTracks = async (pin: string, tracks: z.infer<typeof Z_TRACKS>) => {
    const roomService = new RoomService(this.ctx);
    const voteService = new VoteService(this.ctx);

    const totalTracks = await this.db.track.count({ where: { pin } });

    const roomTracks = await this.db.track.findMany({
      where: { pin },
    });

    const existingTracks = roomTracks.map(({ trackId }) => trackId);

    const newTracks = tracks.filter(
      ({ trackId }) => !existingTracks.includes(trackId),
    );

    await this.db.track.createMany({
      data: newTracks.map((track, index) => ({
        ...track,
        pin,
        index: totalTracks + index,
      })),
    });

    const promises = existingTracks.map((trackId) =>
      voteService.createVote(pin, trackId, VOTE.UP),
    );
    await Promise.all(promises);

    await roomService.reorderPlaylist(pin);
  };
}
