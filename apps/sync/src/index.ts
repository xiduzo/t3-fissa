import cron from "node-cron";
import { addSeconds, differenceInMilliseconds } from "@fissa/utils/date";

import { api } from "./utils/api";

const timeouts = new Map<string, NodeJS.Timeout>();

const startTimeouts = async () => {
  console.info("Fetching rooms...");
  const rooms = await api.room.all.query();
  console.info(`Found ${rooms.length} active rooms`);

  timeouts.forEach(clearTimeout);
  timeouts.clear();

  rooms.forEach((room) => {
    // -X seconds to be safe because we check if the user is still listening
    // in spotify anything before playing the next track.
    // The service will account for this difference
    const endTime = addSeconds(room.expectedEndTime, -10);

    console.info(
      `next track for ${room.pin} in ${differenceInMilliseconds(
        endTime,
        new Date(),
      )}ms`,
    );

    const timeout = setTimeout(async () => {
      try {
        console.log(`starting next track for ${room.pin}...`);
        await api.room.nextTrack.mutate(room);
      } catch (error) {
        console.error(error);
      }
    }, differenceInMilliseconds(endTime, new Date()));

    timeouts.set(room.pin, timeout);
  });
};

//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *
cron.schedule(`*/30 * * * * *`, startTimeouts);

startTimeouts();
