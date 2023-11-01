import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@fissa/utils";

import { api } from "./apiProxy";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const fissas = await api.fissa.sync.active.query();

  if (!fissas?.length) {
    res.status(204).json({ name: "No fissa needed to be synced" });
    return res.end();
  }

  for (const fissa of fissas) {
    try {
      await api.auth.sync.refreshToken.mutate(fissa.pin);
    } catch (error) {
      logger.error(`${fissa.pin}, access token refresh failed`, error);
    }
  }

  res.status(200).json({ name: "Sync token" });
  res.end();
}
