# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.4 --activate
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
COPY . .
RUN SKIP_ENV_VALIDATION=1 pnpm turbo build --filter=@fissa/server...

# ── Production ───────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app .

EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
