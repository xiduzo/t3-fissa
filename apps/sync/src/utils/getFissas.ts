import { logger } from "@fissa/utils";

import { api } from "./api";

export const getFissas = async () => {
  try {
    const fissas = await api.fissa.sync.active.query();
    return fissas;
  } catch (error) {
    logger.error("Fetching fissas failed", error);
    return [];
  }
};
