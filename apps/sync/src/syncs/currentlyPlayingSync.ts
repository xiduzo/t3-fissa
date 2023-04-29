import { addSeconds, differenceInMilliseconds, logger } from "@fissa/utils";

import { api } from "../utils/api";
import { getFissas } from "../utils/getFissas";

const timeouts = new Map<string, NodeJS.Timeout>();
const startingNextTracks = new Set<string>();

export const currentlyPlayingSync = async () => {
  const fissas = await getFissas();

  timeouts.forEach(clearTimeout);
  timeouts.clear();

  for (const fissa of fissas) {
    // -X seconds to be safe because we check if the user is still listening
    // in spotify anything before playing the next track.
    // The service will account for this difference
    const endTime = addSeconds(fissa.expectedEndTime, -5);

    const delay = differenceInMilliseconds(endTime, new Date());

    logger.debug(`${fissa.pin}, next track in ${delay}ms`);

    if (startingNextTracks.has(fissa.pin)) continue;

    const timeout = setTimeoutForNextTrack(fissa.pin, delay);

    timeouts.set(fissa.pin, timeout);
  }
};

const setTimeoutForNextTrack = (pin: string, delay: number) => {
  return setTimeout(async () => {
    try {
      startingNextTracks.add(pin);
      logger.debug(`,${pin}, starting next track`);
      await api.fissa.sync.next.mutate(pin);
      logger.debug(`${pin}, next track started`);
    } catch (error) {
      logger.notice(`${pin}, next track failed`, error);
    } finally {
      startingNextTracks.delete(pin);
    }
  }, delay);
};
