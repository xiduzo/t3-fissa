CREATE INDEX "tracks_pin_idx" ON "tracks" USING btree ("pin");--> statement-breakpoint
CREATE INDEX "users_in_fissas_user_id_idx" ON "users_in_fissas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "votes_pin_idx" ON "votes" USING btree ("pin");--> statement-breakpoint
CREATE INDEX "votes_user_id_idx" ON "votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "votes_pin_user_id_idx" ON "votes" USING btree ("pin","user_id");