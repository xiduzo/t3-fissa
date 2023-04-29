import { logger } from "@fissa/utils";

import { api } from "../utils/api";
import { getFissas } from "../utils/getFissas";

export const accessTokenSync = async () => {
  const fissas = await getFissas()

  for (const fissa of fissas) {
    try {
      logger.debug(`${fissa.pin}, refreshing access token`);
      await api.auth.sync.refreshToken.mutate(fissa.pin);
      logger.debug(`${fissa.pin}, access token refreshed`);
    } catch (error) {
      logger.error(`${fissa.pin}, access token refresh failed`, error);
    }
  }
};
