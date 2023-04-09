import { differenceInSeconds } from "@fissa/utils";

import { api } from "../utils/api";

export const reorderPlaylistSync = async () => {
  const rooms = await api.room.sync.active.query();

  for (const room of rooms) {
    if (!room.shouldReorder) return;

    try {
      console.log(`reordering playlist for ${room.pin}...`);
      await api.track.sync.reorder.mutate(room.pin);
      console.log(`reordering done for ${room.pin}`);
    } catch (error) {
      console.error(`reordering failed for ${room.pin}`, error);
    }
  }
};
