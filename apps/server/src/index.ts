import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { auth } from "@fissa/auth";
import { appRouter, createTRPCContext, FissaSyncOrchestrator } from "@fissa/api";
import { db, runMigrations } from "@fissa/db";
import { env } from "@fissa/env";

// ---------------------------------------------------------------------------
// Run pending migrations before anything else
// ---------------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsPath = process.env.MIGRATIONS_PATH
  ?? path.resolve(__dirname, "../../../packages/db/drizzle");

console.info("[server] running migrations…");
await runMigrations(migrationsPath);
console.info("[server] migrations complete");

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [env.WEB_URL],
    credentials: true,
  }),
);

// tRPC
app.all("/api/trpc/*", (c) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

// Auth (Spotify OAuth)
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true }));

console.info(`[server] listening on port ${env.PORT}`);
serve({ fetch: app.fetch, port: env.PORT });

// ---------------------------------------------------------------------------
// Orchestration loop
// ---------------------------------------------------------------------------

const serviceCaller = appRouter.createCaller({
  database: db,
  session: null,
  headers: new Headers({ authorization: env.BETTER_AUTH_SECRET }),
});

const orchestrator = new FissaSyncOrchestrator({
  getActiveFissas: () => serviceCaller.fissa.sync.active(),
  playNextTrack: (pin) => serviceCaller.fissa.sync.next(pin),
  refreshToken: (pin) => serviceCaller.auth.sync.refreshToken(pin),
});

orchestrator.startIntervals();

