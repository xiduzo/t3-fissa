import { z } from "zod";
import { VOTE } from "@fissa/db";

import { Z_TRACKS } from "../router/constants";
import { ServiceWithContext } from "../utils/context";
import { RoomService } from "./RoomService";
import { VoteService } from "./VoteService";

export class TrackService extends ServiceWithContext {
  byRoomId = async (roomId: string) => {
    return this.db.track.findMany({
      where: { roomId },
      orderBy: { index: "asc" },
    });
  };

  addTracks = async (roomId: string, tracks: z.infer<typeof Z_TRACKS>) => {
    const roomService = new RoomService(this.ctx);
    const voteService = new VoteService(this.ctx);

    const totalTracks = await this.db.track.count({ where: { roomId } });

    // TODO: update tracks which are already in the room
    // don't add them again, but give an upvote
    await this.db.track.createMany({
      data: tracks.map((track, index) => ({
        ...track,
        roomId,
        index: totalTracks + index,
      })),
    });

    const votes = tracks.map(({ trackId }) =>
      voteService.createVote(roomId, trackId, VOTE.UP),
    );
    await Promise.all(votes);

    await roomService.reorderPlaylist(roomId);
  };
}
