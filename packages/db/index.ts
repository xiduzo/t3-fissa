import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export type { InferSelectModel } from "drizzle-orm";

import type { InferSelectModel } from "drizzle-orm";
import { fissas, tracks } from "./schema";
export type Fissa = InferSelectModel<typeof fissas>;
export type Track = InferSelectModel<typeof tracks>;

const client = postgres(process.env.DATABASE_URL!);

const createDb = () => drizzle(client, { schema });

type DrizzleDB = ReturnType<typeof createDb>;

const globalForDb = globalThis as unknown as { db: DrizzleDB };

export const db: DrizzleDB = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export type DB = DrizzleDB;
