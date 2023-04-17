import cron from "node-cron";

import {
  accessTokenSync,
  currentlyPlayingSync,
  reorderPlaylistSync,
} from "./syncs";

//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *
cron.schedule(`*/20 * * * *`, accessTokenSync);
cron.schedule(`*/1 * * * *`, currentlyPlayingSync);
cron.schedule(`*/2 * * * * *`, reorderPlaylistSync);

console.info("Sync server is running");
