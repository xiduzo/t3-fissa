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
cron.schedule(`*/10 * * * * *`, reorderPlaylistSync);
