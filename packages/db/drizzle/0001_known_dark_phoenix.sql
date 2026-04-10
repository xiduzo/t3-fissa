ALTER TABLE "sessions" DROP CONSTRAINT "sessions_session_token_unique";--> statement-breakpoint
ALTER TABLE "sessions" ADD PRIMARY KEY ("session_token");--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "id";