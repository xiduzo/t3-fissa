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
    _db.execSync(
      "CREATE TABLE IF NOT EXISTS playlist_tracks (playlist_id TEXT PRIMARY KEY NOT NULL, tracks TEXT NOT NULL, updated_at INTEGER NOT NULL);",
    );
    _db.execSync(
      "CREATE TABLE IF NOT EXISTS spotify_tracks (track_id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL, last_used INTEGER NOT NULL);",
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


/**
 * Cache for playlist tracks — stores the full track JSON per playlist ID.
 * Used by PickTracks to show cached tracks instantly on re-entry.
 */
export const playlistTrackCache = {
  get(playlistId: string): SpotifyApi.TrackObjectFull[] | null {
    const db = getDb();
    const row = db.getFirstSync<{ tracks: string }>(
      "SELECT tracks FROM playlist_tracks WHERE playlist_id = ?;",
      [playlistId],
    );
    if (!row) return null;
    try {
      return JSON.parse(row.tracks) as SpotifyApi.TrackObjectFull[];
    } catch {
      return null;
    }
  },

  set(playlistId: string, tracks: SpotifyApi.TrackObjectFull[]): void {
    const db = getDb();
    db.runSync(
      "INSERT OR REPLACE INTO playlist_tracks (playlist_id, tracks, updated_at) VALUES (?, ?, ?);",
      [playlistId, JSON.stringify(tracks), Date.now()],
    );
  },

  remove(playlistId: string): void {
    const db = getDb();
    db.runSync("DELETE FROM playlist_tracks WHERE playlist_id = ?;", [playlistId]);
  },
};


/**
 * Cache for the user's Spotify playlists.
 * Read synchronously on app start so the playlist list renders instantly.
 */
export const playlistCache = {
  get(): SpotifyApi.PlaylistObjectSimplified[] | null {
    const db = getDb();
    const row = db.getFirstSync<{ value: string }>(
      "SELECT value FROM kv WHERE key = 'user-playlists';",
    );
    if (!row) return null;
    try {
      return JSON.parse(row.value) as SpotifyApi.PlaylistObjectSimplified[];
    } catch {
      return null;
    }
  },

  set(playlists: SpotifyApi.PlaylistObjectSimplified[]): void {
    const db = getDb();
    db.runSync(
      "INSERT OR REPLACE INTO kv (key, value) VALUES ('user-playlists', ?);",
      [JSON.stringify(playlists)],
    );
  },
};


/** Tracks older than 7 days without use get evicted. */
const TRACK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Per-track cache with lastUsed timestamps.
 * Reads are synchronous so the UI can show cached data on first render.
 */
export const trackCache = {
  getMany(trackIds: string[]): Map<string, SpotifyApi.TrackObjectFull> {
    if (!trackIds.length) return new Map();
    const db = getDb();
    const placeholders = trackIds.map(() => "?").join(",");
    const rows = db.getAllSync<{ track_id: string; data: string }>(
      `SELECT track_id, data FROM spotify_tracks WHERE track_id IN (${placeholders});`,
      trackIds,
    );
    const map = new Map<string, SpotifyApi.TrackObjectFull>();
    for (const row of rows) {
      try {
        map.set(row.track_id, JSON.parse(row.data) as SpotifyApi.TrackObjectFull);
      } catch {
        // skip corrupt entries
      }
    }
    return map;
  },

  setMany(tracks: SpotifyApi.TrackObjectFull[]): void {
    if (!tracks.length) return;
    const db = getDb();
    const now = Date.now();
    const stmt = db.prepareSync(
      "INSERT OR REPLACE INTO spotify_tracks (track_id, data, last_used) VALUES (?, ?, ?);",
    );
    try {
      for (const track of tracks) {
        stmt.executeSync([track.id, JSON.stringify(track), now]);
      }
    } finally {
      stmt.finalizeSync();
    }
  },

  touchMany(trackIds: string[]): void {
    if (!trackIds.length) return;
    const db = getDb();
    const now = Date.now();
    const placeholders = trackIds.map(() => "?").join(",");
    db.runSync(
      `UPDATE spotify_tracks SET last_used = ? WHERE track_id IN (${placeholders});`,
      [now, ...trackIds],
    );
  },

  evictStale(): void {
    const db = getDb();
    const cutoff = Date.now() - TRACK_TTL_MS;
    db.runSync("DELETE FROM spotify_tracks WHERE last_used < ?;", [cutoff]);
  },
};
