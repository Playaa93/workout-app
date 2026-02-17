CREATE TYPE "public"."cardio_activity" AS ENUM('running', 'walking', 'cycling', 'rowing', 'jump_rope', 'swimming', 'elliptical', 'stepper', 'hiit', 'other');--> statement-breakpoint
CREATE TYPE "public"."data_source" AS ENUM('superphysique', 'delavier', 'manual', 'combined');--> statement-breakpoint
CREATE TYPE "public"."exercise_type" AS ENUM('compound', 'isolation');--> statement-breakpoint
CREATE TYPE "public"."movement_pattern" AS ENUM('push', 'pull', 'squat', 'hinge', 'lunge', 'carry', 'rotation', 'isolation');--> statement-breakpoint
CREATE TYPE "public"."session_type" AS ENUM('strength', 'cardio');--> statement-breakpoint
CREATE TABLE "cardio_intervals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"interval_number" integer NOT NULL,
	"duration_seconds" integer,
	"distance_meters" numeric(8, 2),
	"pace_seconds_per_km" integer,
	"heart_rate" integer,
	"performed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "exercises" ALTER COLUMN "secondary_muscles" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ALTER COLUMN "equipment" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ALTER COLUMN "instructions" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "aliases" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "movement_pattern" "movement_pattern" DEFAULT 'isolation';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "exercise_type" "exercise_type" DEFAULT 'isolation';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "primary_muscles" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "stabilizers" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "equipment_alternatives" varchar(50)[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "good_for" jsonb DEFAULT '{"morphotypes":[],"conditions":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "bad_for" jsonb DEFAULT '{"morphotypes":[],"conditions":[]}'::jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "modifications" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "goal_scores" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "morpho_protocols" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "programming_priority" varchar(20);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "rest_modifiers" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "tempo_recommendations" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "synergies" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "antagonists" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "contraindications" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "volume_landmarks" jsonb;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "technique_cues" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "common_mistakes" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "source" "data_source" DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "measurements" ADD COLUMN "abdomen" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "measurements" ADD COLUMN "glutes" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "measurements" ADD COLUMN "wrist" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "measurements" ADD COLUMN "ankle" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "session_type" "session_type" DEFAULT 'strength';--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "cardio_activity" "cardio_activity";--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "distance_meters" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "avg_pace_seconds_per_km" integer;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "avg_speed_kmh" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "avg_heart_rate" integer;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD COLUMN "max_heart_rate" integer;--> statement-breakpoint
ALTER TABLE "cardio_intervals" ADD CONSTRAINT "cardio_intervals_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cardio_intervals_session" ON "cardio_intervals" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_exercises_pattern" ON "exercises" USING btree ("movement_pattern");--> statement-breakpoint
CREATE INDEX "idx_exercises_type" ON "exercises" USING btree ("exercise_type");