import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { appRouter } from "@fissa/api";
import { logger } from "@fissa/utils";

const client = new PrismaClient({});

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const caller = appRouter.createCaller({
    prisma: new PrismaClient({}),
    session: null,
  });

  const fissas = await caller.fissa.sync.active();

  if (!fissas?.length) {
    res.status(204).json({ name: "No fissa needed to be synced" });
    return res.end();
  }

  for (const fissa of fissas) {
    try {
      await caller.auth.sync.refreshToken(fissa.pin);
    } catch (error) {
      logger.error(`${fissa.pin}, access token refresh failed`, error);
    }
  }

  res.status(200).json({ name: "Sync token" });
  res.end();
}
