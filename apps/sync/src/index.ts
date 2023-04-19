import cron from "node-cron";
import { logger } from "@fissa/utils";

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

logger.info("Sync server is running");
