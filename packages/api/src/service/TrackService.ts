import { z } from "zod";

import { Z_TRACKS } from "../router/constants";
import { ServiceWithContext } from "../utils/context";

export class TrackService extends ServiceWithContext {
  byRoomId = async (roomId: string) => {
    return this.db.track.findMany({
      where: { roomId },
      orderBy: { index: "asc" },
    });
  };

  addTracks = async (roomId: string, tracks: z.infer<typeof Z_TRACKS>) => {
    const totalTracks = await this.db.track.count({ where: { roomId } });

    // TODO: update tracks which are already in the room
    // don't add them again, but give an upvote
    return this.db.track.createMany({
      data: tracks.map((track, index) => ({
        ...track,
        roomId,
        index: totalTracks + index,
      })),
    });
  };
}
