import { addSeconds, isPast } from "@fissa/utils";

import { api } from "../utils/api";

export const reorderPlaylistSync = async () => {
  const rooms = await api.room.sync.active.query();

  await Promise.all(
    rooms.map(async (room) => {
      if (!room.shouldReorder) return Promise.resolve();

      // Don't reorder when we are close to switching to the next track
      if (isPast(addSeconds(room.expectedEndTime, -5)))
        return Promise.resolve();

      try {
        console.log(`reordering playlist for ${room.pin}...`);
        return api.track.sync.reorder.mutate(room.pin);
      } catch (error) {
        console.error(error);
        return Promise.resolve();
      }
    }),
  );
};
