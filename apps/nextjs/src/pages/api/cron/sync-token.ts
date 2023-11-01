import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@fissa/utils";

import { api } from "~/utils/api";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const { data } = api.fissa.sync.active.useQuery();
  const { mutateAsync } = api.auth.sync.refreshToken.useMutation();

  if (!data?.length) {
    res.status(204).json({ name: "No fissa needed to be synced" });
    return res.end();
  }

  for (const fissa of data) {
    try {
      await mutateAsync(fissa.pin);
    } catch (error) {
      logger.error(`${fissa.pin}, access token refresh failed`, error);
    }
  }

  res.status(200).json({ name: "Sync token" });
  res.end();
}
