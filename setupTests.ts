// Global Vitest setup — referenced by the root vitest config via `setupFiles`.
// Skip @fissa/env validation and give @fissa/db a dummy URL so modules that
// transitively import the db (e.g. projections) load without real secrets.
// Tests mock the database; nothing connects.
process.env.SKIP_ENV_VALIDATION = "1";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";

export {};
