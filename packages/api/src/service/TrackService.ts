import { z } from "zod";

import { addTracks } from "../router/track";
import { ServiceWithContext } from "../utils/context";

export class TrackService extends ServiceWithContext {
  byRoomId = async (roomId: string) => {
    return this.db.track.findMany({
      where: { roomId },
      orderBy: { index: "asc" },
    });
  };

  addTracks = async (input: z.infer<typeof addTracks>) => {
    const { roomId, tracks } = input;

    const totalTracks = await this.db.track.count({ where: { roomId } });

    // TODO filter out tracks that are already in queue
    // Give them a upvote instead

    return this.db.track.createMany({
      data: tracks.map((track, index) => ({
        ...track,
        roomId,
        index: totalTracks + index,
      })),
    });
  };
}
