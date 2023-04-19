import cron from "node-cron";
import { Logger } from "@fissa/utils";

import { accessTokenSync, currentlyPlayingSync } from "./syncs";

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

Logger.info("Sync server is running");
