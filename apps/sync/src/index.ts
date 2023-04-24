import { Cron } from "croner";
import { logger } from "@fissa/utils";

import { accessTokenSync, currentlyPlayingSync } from "./syncs";

// ┌──────────────── (optional) second (0 - 59)
// │ ┌────────────── minute (0 - 59)
// │ │ ┌──────────── hour (0 - 23)
// │ │ │ ┌────────── day of month (1 - 31)
// │ │ │ │ ┌──────── month (1 - 12, JAN-DEC)
// │ │ │ │ │ ┌────── day of week (0 - 6, SUN-Mon)
// │ │ │ │ │ │       (0 to 6 are Sunday to Saturday; 7 is Sunday, the same as 0)
// │ │ │ │ │ │
// * * * * * *
Cron(`*/20 * * * *`, accessTokenSync);
Cron(`*/1 * * * *`, currentlyPlayingSync);

logger.info("Sync server is running");
