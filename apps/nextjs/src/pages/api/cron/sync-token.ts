import { appRouter } from "@fissa/api";
import { PrismaClient } from "@prisma/client";
import { type NextApiRequest, type NextApiResponse } from "next";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

export default async function handler(_: NextApiRequest, res: NextApiResponse) {
  const caller = appRouter.createCaller({
    database: prisma,
    session: null,
    headers: {
      authorization: process.env.NEXTAUTH_SECRET,
    }
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
      console.error(`${fissa.pin}, access token refresh failed`, error);
    }
  }

  res.status(200).json({ name: "Sync token" });
  res.end();
}
