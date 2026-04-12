#!/usr/bin/env bash
set -euo pipefail

# Add libpq (pg_dump, psql) to PATH if installed via Homebrew
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

# ─────────────────────────────────────────────────────────────────────────────
# Migrate data from Supabase to Dokploy Postgres
#
# Usage:
#   ./scripts/migrate-from-supabase.sh
#
# Required env vars (or pass inline):
#   SUPABASE_DB_URL  — your Supabase connection string
#   TARGET_DB_URL    — your Dokploy Postgres connection string
# ─────────────────────────────────────────────────────────────────────────────

# DATABASE_URL=postgresql://glosario:glosario@192.168.68.250:9996/glosario
SUPABASE_DB_URL="postgres://postgres.kuladhvllcidtwvejooz:7x0GFt%ARSYcD6gK@sk*@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
TARGET_DB_URL="postgresql://postgres:CJKTWtjaRz8*Lmu-Hnkf@192.168.68.250:9995/fissa"

DUMP_FILE="supabase_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Supabase → Dokploy Postgres Migration                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# Step 1: Apply Drizzle schema to target (creates tables if they don't exist)
echo ""
echo "→ Step 1: Applying Drizzle migrations to target database..."
# Run drizzle-kit directly from packages/db — the pnpm `db:migrate` script
# uses dotenv-cli which overrides DATABASE_URL with the .env value.
(cd packages/db && DATABASE_URL="$TARGET_DB_URL" npx drizzle-kit migrate)
echo "  ✓ Schema applied"

# Step 2: Dump DATA ONLY from Supabase (no schema, no ownership)
echo ""
echo "→ Step 2: Dumping data from Supabase..."
pg_dump "$SUPABASE_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --exclude-schema='auth' \
  --exclude-schema='storage' \
  --exclude-schema='realtime' \
  --exclude-schema='supabase_*' \
  --exclude-schema='extensions' \
  --exclude-schema='_realtime' \
  --exclude-schema='pgsodium*' \
  --exclude-schema='vault' \
  --exclude-schema='graphql*' \
  -f "$DUMP_FILE"
echo "  ✓ Dump saved to $DUMP_FILE"

# Step 3: Restore data into target
echo ""
echo "→ Step 3: Restoring data to target database..."
psql "$TARGET_DB_URL" -f "$DUMP_FILE"
echo "  ✓ Data restored"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Migration complete! Verify with:"
echo "    psql \"$TARGET_DB_URL\" -c 'SELECT count(*) FROM users;'"
echo "════════════════════════════════════════════════════════════════"
