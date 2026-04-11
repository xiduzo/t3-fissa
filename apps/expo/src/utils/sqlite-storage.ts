import * as SQLite from "expo-sqlite";

/**
 * A simple key-value storage adapter backed by expo-sqlite.
 * Works in both Expo Go and dev builds — no native module issues.
 *
 * Implements the interface expected by both:
 * - Zustand's `StateStorage` (getItem / setItem / removeItem)
 * - TanStack Query's `AsyncStoragePersister` (getItem / setItem / removeItem)
 */

const DB_NAME = "fissa-cache.db";

let _db: SQLite.SQLiteDatabase | null = null;

function getDb() {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
    _db.execSync(
      "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);",
    );
  }
  return _db;
}

export const sqliteStorage = {
  getItem(key: string): string | null {
    const db = getDb();
    const row = db.getFirstSync<{ value: string }>(
      "SELECT value FROM kv WHERE key = ?;",
      [key],
    );
    return row?.value ?? null;
  },

  setItem(key: string, value: string): void {
    const db = getDb();
    db.runSync(
      "INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);",
      [key, value],
    );
  },

  removeItem(key: string): void {
    const db = getDb();
    db.runSync("DELETE FROM kv WHERE key = ?;", [key]);
  },
};
