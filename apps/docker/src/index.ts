import cron from "node-cron";
import {
  addMinutes,
  differenceInMilliseconds,
  isFuture,
} from "@fissa/utils";

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

const INTERVAL = 1;

// cron.schedule(`30 */${INTERVAL} * * * *`, async () => {
cron.schedule(`*/10 * * * * *`, async () => {
  console.log("fetch rooms");
  const rooms = await api.room.all.query();

  console.log(rooms);

  rooms.forEach(async (room) => {
    const nextRound = addMinutes(room.expectedEndTime, INTERVAL);

    if (isFuture(nextRound)) return;
    console.log(differenceInMilliseconds(room.expectedEndTime, new Date()));

    setTimeout(
      () => api.room.nextTrack.mutate(room.pin),
      differenceInMilliseconds(room.expectedEndTime, new Date()) - 5000,
    );
  });
});

console.log("started");
