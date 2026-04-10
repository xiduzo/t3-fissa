import { serve } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { Auth, authConfig } from "@fissa/auth";
import { appRouter, createTRPCContext } from "@fissa/api";
import { addSeconds, differenceInMilliseconds } from "@fissa/utils";
import { db } from "@fissa/db";
const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [process.env.WEB_URL ?? "http://localhost:5173"],
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
app.all("/api/auth/*", (c) =>
  Auth(c.req.raw, { ...authConfig, basePath: "/api/auth" }),
);

app.get("/health", (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3000);
console.info(`[server] listening on port ${port}`);
serve({ fetch: app.fetch, port });

// ---------------------------------------------------------------------------
// Orchestration loop — replaces Vercel cron jobs
// ---------------------------------------------------------------------------

const serviceCaller = appRouter.createCaller({
  database: db,
  session: null,
  headers: new Headers({ authorization: process.env.NEXTAUTH_SECRET ?? "" }),
});

const SYNC_INTERVAL_MS = 55_000;
const WIGGLE_S = 5;

async function syncFissas() {
  try {
    const fissas = await serviceCaller.fissa.sync.active();
    if (!fissas?.length) return;

    for (const fissa of fissas) {
      try {
        const endTime = addSeconds(fissa.expectedEndTime, -WIGGLE_S);
        const delay = differenceInMilliseconds(endTime, new Date());

        if (delay >= SYNC_INTERVAL_MS) continue;

        console.info(`[sync] ${fissa.pin} — next track in ${delay}ms`);

        setTimeout(() => {
          serviceCaller.fissa.sync
            .next(fissa.pin)
            .catch((err: unknown) =>
              console.error(`[sync] ${fissa.pin} failed`, err),
            );
        }, Math.max(0, delay));
      } catch (err) {
        console.error(`[sync] ${fissa.pin} error`, err);
      }
    }
  } catch (err) {
    console.error("[sync] loop error", err);
  }
}

async function syncTokens() {
  try {
    const fissas = await serviceCaller.fissa.sync.active();
    if (!fissas?.length) return;

    for (const fissa of fissas) {
      try {
        await serviceCaller.auth.sync.refreshToken(fissa.pin);
      } catch (err) {
        console.error(`[token] ${fissa.pin} refresh failed`, err);
      }
    }
  } catch (err) {
    console.error("[token] loop error", err);
  }
}

void syncFissas();
void syncTokens();
setInterval(() => void syncFissas(), SYNC_INTERVAL_MS);
setInterval(() => void syncTokens(), SYNC_INTERVAL_MS);
