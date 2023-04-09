import { addSeconds, differenceInMilliseconds } from "@fissa/utils";

import { api } from "../utils/api";

const timeouts = new Map<string, NodeJS.Timeout>();

export const currentlyPlayingSync = async () => {
  const fissas = await api.fissa.sync.active.query();

  timeouts.forEach(clearTimeout);
  timeouts.clear();

  for (const fissa of fissas) {
    // -X seconds to be safe because we check if the user is still listening
    // in spotify anything before playing the next track.
    // The service will account for this difference
    const endTime = addSeconds(fissa.expectedEndTime, -5);

    console.info(
      `next track for ${fissa.pin} in ${differenceInMilliseconds(
        endTime,
        new Date(),
      )}ms`,
    );

    const timeout = setTimeout(async () => {
      try {
        console.log(`starting next track for ${fissa.pin}...`);
        await api.fissa.sync.next.mutate(fissa);
        console.log(`next track started for ${fissa.pin}`);
      } catch (error) {
        console.error(`next track failed for ${fissa.pin}`, error);
      }
    }, differenceInMilliseconds(endTime, new Date()));

    timeouts.set(fissa.pin, timeout);
  }
};
