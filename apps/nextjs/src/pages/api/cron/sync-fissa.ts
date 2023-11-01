import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { appRouter } from "@fissa/api";
import { addSeconds, differenceInMilliseconds, logger } from "@fissa/utils";

export const maxDuration = 120;
export const config = {
  maxDuration,
};

const CRON_INTERVAL = 60 * 1000;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const caller = appRouter.createCaller({
    prisma,
    session: null,
  });

  const fissas = await caller.fissa.sync.active();

  if (!fissas?.length) {
    res.status(204).json({ name: "No fissa needed to be synced" });
    return res.end();
  }

  const promises: Promise<string>[] = [];

  for (const fissa of fissas) {
    try {
      // -X seconds to be safe because we check if the user is still listening
      // in spotify anything before playing the next track.
      // The service will account for this difference
      const endTime = addSeconds(fissa.expectedEndTime, -5);
      const delay = differenceInMilliseconds(endTime, new Date());

      if (delay >= CRON_INTERVAL) continue;

      logger.info(`${fissa.pin}, next track in ${delay}ms`);

      const promise = new Promise<string>((resolve) => {
        setTimeout(() => {
          caller.fissa.sync.next(fissa.pin).finally(() => resolve(fissa.pin));
        }, delay);
      });

      promises.push(promise);
    } catch (error) {
      logger.error(`${fissa.pin}, next track failed`, error);
    }
  }

  await Promise.allSettled(promises);

  res.status(200).json({ name: "Sync fissa" });
  res.end();
}
