# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.0.4 --activate
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/env/package.json packages/env/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/tailwind-config/package.json packages/tailwind-config/package.json
RUN pnpm install --frozen-lockfile

# ── Build ────────────────────────────────────────────────────────────────────
FROM deps AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}
COPY . .
RUN SKIP_ENV_VALIDATION=1 pnpm turbo build --filter=@fissa/web...

# ── Serve with nginx ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
