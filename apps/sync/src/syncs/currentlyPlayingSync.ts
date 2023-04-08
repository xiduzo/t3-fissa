import { addSeconds, differenceInMilliseconds } from "@fissa/utils";

import { api } from "../utils/api";

const timeouts = new Map<string, NodeJS.Timeout>();

export const currentlyPlayingSync = async () => {
  const rooms = await api.room.sync.active.query();

  timeouts.forEach(clearTimeout);
  timeouts.clear();

  for(const room of rooms) {
    // -X seconds to be safe because we check if the user is still listening
    // in spotify anything before playing the next track.
    // The service will account for this difference
    const endTime = addSeconds(room.expectedEndTime, -5);

    console.info(
      `next track for ${room.pin} in ${differenceInMilliseconds(
        endTime,
        new Date(),
      )}ms`,
    );

    const timeout = setTimeout(async () => {
      try {
        console.log(`starting next track for ${room.pin}...`);
        await api.room.sync.next.mutate(room);
        console.log(`next track started for ${room.pin}...`);
      } catch (error) {
        console.error(`next track failed for ${room.pin}...`, error);
      }
    }, differenceInMilliseconds(endTime, new Date()));

    timeouts.set(room.pin, timeout);
  };
};
