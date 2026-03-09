ALTER TABLE "ear_training_scores" DROP CONSTRAINT "ear_training_scores_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "metronome_presets" DROP CONSTRAINT "metronome_presets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "practice_goals" DROP CONSTRAINT "practice_goals_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "practice_goals" DROP CONSTRAINT "practice_goals_instrument_id_instruments_id_fk";
--> statement-breakpoint
ALTER TABLE "practice_sessions" DROP CONSTRAINT "practice_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "practice_sessions" DROP CONSTRAINT "practice_sessions_instrument_id_instruments_id_fk";
--> statement-breakpoint
ALTER TABLE "practice_sessions" DROP CONSTRAINT "practice_sessions_song_id_songs_id_fk";
--> statement-breakpoint
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_progress" DROP CONSTRAINT "user_progress_song_id_songs_id_fk";
--> statement-breakpoint
ALTER TABLE "ear_training_scores" ADD CONSTRAINT "ear_training_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metronome_presets" ADD CONSTRAINT "metronome_presets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_goals" ADD CONSTRAINT "practice_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_goals" ADD CONSTRAINT "practice_goals_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;