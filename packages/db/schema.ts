import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const badgeEnum = pgEnum("BADGE", [
  "TRACKS_ADDED",
  "UP_VOTES_RECEIVED",
  "DOWN_VOTES_RECEIVED",
  "FISSAS_CREATED",
  "FISSAS_JOINED",
  "UP_VOTES_CAST",
  "DOWN_VOTES_CAST",
  "POINTS_EARNED",
]);

/** Drop-in replacement for Prisma's `BADGE` enum constant. */
export const BADGE = {
  TRACKS_ADDED: "TRACKS_ADDED",
  UP_VOTES_RECEIVED: "UP_VOTES_RECEIVED",
  DOWN_VOTES_RECEIVED: "DOWN_VOTES_RECEIVED",
  FISSAS_CREATED: "FISSAS_CREATED",
  FISSAS_JOINED: "FISSAS_JOINED",
  UP_VOTES_CAST: "UP_VOTES_CAST",
  DOWN_VOTES_CAST: "DOWN_VOTES_CAST",
  POINTS_EARNED: "POINTS_EARNED",
} as const;

export type BADGE = (typeof BADGE)[keyof typeof BADGE];

// ---------------------------------------------------------------------------
// NextAuth tables
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [unique().on(t.provider, t.providerAccountId)],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (t) => [unique().on(t.identifier, t.token)],
);

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const fissas = pgTable("fissas", {
  pin: varchar("pin", { length: 4 }).primaryKey(),
  currentlyPlayingId: varchar("currently_playing_id", { length: 22 }),
  currentlyPlayingPin: varchar("currently_playing_pin", { length: 4 }),
  expectedEndTime: timestamp("expected_end_time").defaultNow().notNull(),
  userId: text("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdateAt: timestamp("last_update_at").defaultNow().notNull(),
});

export const tracks = pgTable(
  "tracks",
  {
    trackId: varchar("track_id", { length: 22 }).notNull(),
    durationMs: integer("duration_ms").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUpdateAt: timestamp("last_update_at").defaultNow().notNull(),
    hasBeenPlayed: boolean("has_been_played").default(false).notNull(),
    pin: varchar("pin", { length: 4 })
      .notNull()
      .references(() => fissas.pin, { onDelete: "cascade" }),
    userId: text("user_id"),
    score: smallint("score").default(0).notNull(),
    totalScore: smallint("total_score").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.pin, t.trackId] })],
);

export const votes = pgTable(
  "votes",
  {
    vote: smallint("vote").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    trackId: varchar("track_id", { length: 22 }).notNull(),
    pin: varchar("pin", { length: 4 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.trackId, t.userId, t.pin] })],
);

export const usersInFissas = pgTable(
  "users_in_fissas",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    pin: varchar("pin", { length: 4 })
      .notNull()
      .references(() => fissas.pin, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    points: integer("points").default(50).notNull(),
  },
  (t) => [primaryKey({ columns: [t.pin, t.userId] })],
);

export const badges = pgTable(
  "badges",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
    name: badgeEnum("name").notNull(),
    score: smallint("score").default(0).notNull(),
  },
  (t) => [unique().on(t.userId, t.name)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  votes: many(votes),
  hostOf: one(fissas, { fields: [users.id], references: [fissas.userId] }),
  isIn: many(usersInFissas),
  tracks: many(tracks),
  badges: many(badges),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const fissasRelations = relations(fissas, ({ one, many }) => ({
  by: one(users, { fields: [fissas.userId], references: [users.id] }),
  currentlyPlaying: one(tracks, {
    fields: [fissas.currentlyPlayingId, fissas.currentlyPlayingPin],
    references: [tracks.trackId, tracks.pin],
  }),
  tracks: many(tracks),
  votes: many(votes),
  users: many(usersInFissas),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  fissa: one(fissas, { fields: [tracks.pin], references: [fissas.pin] }),
  by: one(users, { fields: [tracks.userId], references: [users.id] }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  by: one(users, { fields: [votes.userId], references: [users.id] }),
  track: one(tracks, {
    fields: [votes.trackId, votes.pin],
    references: [tracks.trackId, tracks.pin],
  }),
  fissa: one(fissas, { fields: [votes.pin], references: [fissas.pin] }),
}));

export const usersInFissasRelations = relations(usersInFissas, ({ one }) => ({
  fissa: one(fissas, {
    fields: [usersInFissas.pin],
    references: [fissas.pin],
  }),
  user: one(users, {
    fields: [usersInFissas.userId],
    references: [users.id],
  }),
}));

export const badgesRelations = relations(badges, ({ one }) => ({
  user: one(users, { fields: [badges.userId], references: [users.id] }),
}));
