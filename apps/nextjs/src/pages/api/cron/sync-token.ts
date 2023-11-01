import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { appRouter } from "@fissa/api";
import { logger } from "@fissa/utils";

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const prisma = new PrismaClient({});
  const caller = appRouter.createCaller({
    prisma,
    session: null,
  });

  const fissas = await caller.fissa.sync.active();

  if (!fissas?.length) {
    await prisma.$disconnect();
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

  await prisma.$disconnect();
  res.status(200).json({ name: "Sync token" });
  res.end();
}
