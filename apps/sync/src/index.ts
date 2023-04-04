import cron from "node-cron";
import { addSeconds, differenceInMilliseconds } from "@fissa/utils";

import { api } from "./utils/api";

//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *

const timeouts = new Map<string, NodeJS.Timeout>();

const startTimeouts = async () => {
  console.info("Fetching rooms...");
  const rooms = await api.room.all.query();
  console.info(`Found ${rooms.length} active rooms`);

  timeouts.forEach(clearTimeout);
  timeouts.clear();

  rooms.forEach((room) => {
    const endTime = addSeconds(room.expectedEndTime, -2);

    console.info(
      `next track for ${room.pin} in ${differenceInMilliseconds(
        endTime,
        new Date(),
      )}ms`,
    );

    const timeout = setTimeout(async () => {
      try {
        await api.room.nextTrack.mutate(room);
      } catch (error) {
        console.error(error);
      }
    }, differenceInMilliseconds(endTime, new Date()));

    timeouts.set(room.pin, timeout);
  });
};

cron.schedule(`*/1 * * * *`, startTimeouts);

startTimeouts();
