import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const log = ["error"]

if (process.env.NODE_ENV === "development") {
  log.push("warn")
  // log.push("query")
}

// @ts-expect-error log type
export const prisma = globalForPrisma.prisma || new PrismaClient({ log });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
