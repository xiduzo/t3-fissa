CREATE TYPE "public"."BADGE" AS ENUM('TRACKS_ADDED', 'UP_VOTES_RECEIVED', 'DOWN_VOTES_RECEIVED', 'FISSAS_CREATED', 'FISSAS_JOINED', 'UP_VOTES_CAST', 'DOWN_VOTES_CAST', 'POINTS_EARNED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_unique" UNIQUE("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "badges" (
	"user_id" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"name" "BADGE" NOT NULL,
	"score" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "badges_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fissas" (
	"pin" varchar(4) PRIMARY KEY NOT NULL,
	"currently_playing_id" varchar(22),
	"currently_playing_pin" varchar(4),
	"expected_end_time" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_update_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fissas_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tracks" (
	"track_id" varchar(22) NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_update_at" timestamp DEFAULT now() NOT NULL,
	"has_been_played" boolean DEFAULT false NOT NULL,
	"pin" varchar(4) NOT NULL,
	"user_id" text,
	"score" smallint DEFAULT 0 NOT NULL,
	"total_score" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "tracks_pin_track_id_pk" PRIMARY KEY("pin","track_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_in_fissas" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"pin" varchar(4) NOT NULL,
	"user_id" text NOT NULL,
	"points" integer DEFAULT 50 NOT NULL,
	CONSTRAINT "users_in_fissas_pin_user_id_pk" PRIMARY KEY("pin","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "verification_tokens_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "votes" (
	"vote" smallint NOT NULL,
	"user_id" text NOT NULL,
	"track_id" varchar(22) NOT NULL,
	"pin" varchar(4) NOT NULL,
	CONSTRAINT "votes_track_id_user_id_pin_pk" PRIMARY KEY("track_id","user_id","pin")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tracks" ADD CONSTRAINT "tracks_pin_fissas_pin_fk" FOREIGN KEY ("pin") REFERENCES "public"."fissas"("pin") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_in_fissas" ADD CONSTRAINT "users_in_fissas_pin_fissas_pin_fk" FOREIGN KEY ("pin") REFERENCES "public"."fissas"("pin") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_in_fissas" ADD CONSTRAINT "users_in_fissas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
