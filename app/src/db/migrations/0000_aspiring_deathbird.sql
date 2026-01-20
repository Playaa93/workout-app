CREATE TYPE "public"."activity_level" AS ENUM('sedentary', 'light', 'moderate', 'active', 'very_active');--> statement-breakpoint
CREATE TYPE "public"."bone_structure" AS ENUM('fine', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."limb_proportion" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TYPE "public"."morphotype" AS ENUM('ectomorph', 'mesomorph', 'endomorph', 'ecto_meso', 'meso_endo', 'ecto_endo');--> statement-breakpoint
CREATE TYPE "public"."nutrition_goal" AS ENUM('bulk', 'maintain', 'cut');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(50) NOT NULL,
	"name_fr" varchar(100) NOT NULL,
	"description_fr" text,
	"icon" varchar(10),
	"xp_reward" integer DEFAULT 0,
	"category" varchar(50),
	"requirement" jsonb,
	"is_secret" boolean DEFAULT false,
	CONSTRAINT "achievements_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"activity_date" date NOT NULL,
	"reference_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "boss_fights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"exercise_id" uuid,
	"target_weight" numeric(6, 2),
	"target_reps" integer,
	"boss_name" varchar(100),
	"boss_level" integer DEFAULT 1,
	"status" varchar(20) DEFAULT 'active',
	"attempts" integer DEFAULT 0,
	"completed_at" timestamp with time zone,
	"winning_set_id" uuid,
	"xp_earned" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_fr" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"description" text,
	"muscle_group" varchar(50) NOT NULL,
	"secondary_muscles" text[],
	"equipment" varchar(50)[],
	"difficulty" varchar(20) DEFAULT 'intermediate',
	"morphotype_recommendations" jsonb,
	"image_url" text,
	"video_url" text,
	"instructions" text[],
	"is_custom" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "food_cravings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_fr" varchar(100) NOT NULL,
	"icon" varchar(10),
	"default_food_id" uuid,
	"estimated_calories" integer,
	"category" varchar(50),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "food_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"food_id" uuid,
	"craving_id" uuid,
	"custom_name" varchar(150),
	"logged_at" timestamp with time zone DEFAULT now(),
	"meal_type" varchar(20),
	"quantity" numeric(6, 2) DEFAULT '1' NOT NULL,
	"serving_size" numeric(6, 1),
	"calories" numeric(6, 1),
	"protein" numeric(5, 1),
	"carbohydrates" numeric(5, 1),
	"fat" numeric(5, 1),
	"photo_url" text,
	"recognized_by_ai" boolean DEFAULT false,
	"ai_confidence" numeric(3, 2),
	"is_cheat" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_fr" varchar(150) NOT NULL,
	"name_en" varchar(150),
	"brand" varchar(100),
	"barcode" varchar(50),
	"calories" numeric(6, 1),
	"protein" numeric(5, 1),
	"carbohydrates" numeric(5, 1),
	"fat" numeric(5, 1),
	"fiber" numeric(5, 1),
	"sugar" numeric(5, 1),
	"sodium" numeric(6, 1),
	"serving_size" numeric(6, 1) DEFAULT '100',
	"serving_unit" varchar(20) DEFAULT 'g',
	"is_custom" boolean DEFAULT false,
	"created_by" uuid,
	"verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"measured_at" timestamp with time zone DEFAULT now(),
	"weight" numeric(5, 2),
	"body_fat_percentage" numeric(4, 1),
	"neck" numeric(5, 2),
	"shoulders" numeric(5, 2),
	"chest" numeric(5, 2),
	"left_arm" numeric(5, 2),
	"right_arm" numeric(5, 2),
	"left_forearm" numeric(5, 2),
	"right_forearm" numeric(5, 2),
	"waist" numeric(5, 2),
	"hips" numeric(5, 2),
	"left_thigh" numeric(5, 2),
	"right_thigh" numeric(5, 2),
	"left_calf" numeric(5, 2),
	"right_calf" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "morpho_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"primary_morphotype" "morphotype" NOT NULL,
	"secondary_morphotype" "morphotype",
	"morphotype_score" jsonb,
	"wrist_circumference" numeric(5, 2),
	"ankle_circumference" numeric(5, 2),
	"bone_structure" "bone_structure",
	"torso_proportion" "limb_proportion",
	"arm_proportion" "limb_proportion",
	"leg_proportion" "limb_proportion",
	"strengths" text[],
	"weaknesses" text[],
	"recommended_exercises" text[],
	"exercises_to_avoid" text[],
	"questionnaire_responses" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "morpho_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "morpho_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_key" varchar(50) NOT NULL,
	"question_text_fr" text NOT NULL,
	"question_type" varchar(20) NOT NULL,
	"options" jsonb,
	"order_index" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "morpho_questions_question_key_unique" UNIQUE("question_key")
);
--> statement-breakpoint
CREATE TABLE "nutrition_daily_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"date" date NOT NULL,
	"total_calories" numeric(7, 1),
	"total_protein" numeric(6, 1),
	"total_carbs" numeric(6, 1),
	"total_fat" numeric(6, 1),
	"avg_7d_calories" numeric(7, 1),
	"avg_7d_protein" numeric(6, 1),
	"avg_7d_carbs" numeric(6, 1),
	"avg_7d_fat" numeric(6, 1),
	"entries_count" integer DEFAULT 0,
	CONSTRAINT "nutrition_daily_summary_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "nutrition_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"goal" "nutrition_goal" DEFAULT 'maintain',
	"activity_level" "activity_level" DEFAULT 'moderate',
	"height" numeric(5, 1),
	"weight" numeric(5, 1),
	"age" integer,
	"is_male" boolean DEFAULT true,
	"tdee" integer,
	"target_calories" integer,
	"target_protein" integer,
	"target_carbs" integer,
	"target_fat" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "nutrition_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"exercise_id" uuid,
	"record_type" varchar(20) NOT NULL,
	"value" numeric(8, 2) NOT NULL,
	"workout_set_id" uuid,
	"achieved_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "personal_records_user_id_exercise_id_record_type_unique" UNIQUE("user_id","exercise_id","record_type")
);
--> statement-breakpoint
CREATE TABLE "progress_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"photo_url" text NOT NULL,
	"thumbnail_url" text,
	"photo_type" varchar(20) NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now(),
	"measurement_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"achievement_id" uuid,
	"unlocked_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_achievements_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_gamification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"total_xp" integer DEFAULT 0,
	"current_level" integer DEFAULT 1,
	"xp_to_next_level" integer DEFAULT 100,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"streak_freeze_available" integer DEFAULT 1,
	"last_activity_date" date,
	"avatar_stage" integer DEFAULT 1,
	"avatar_customization" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_gamification_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"language" varchar(10) DEFAULT 'fr',
	"theme" varchar(20) DEFAULT 'system',
	"notifications_enabled" boolean DEFAULT true,
	"unit_system" varchar(10) DEFAULT 'metric',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"display_name" varchar(100),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_login_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"template_id" uuid,
	"started_at" timestamp with time zone DEFAULT now(),
	"ended_at" timestamp with time zone,
	"duration_minutes" integer,
	"total_volume" numeric(10, 2),
	"calories_burned" integer,
	"perceived_difficulty" integer,
	"energy_level" integer,
	"mood" varchar(20),
	"notes" text,
	"is_boss_fight" boolean DEFAULT false,
	"boss_fight_completed" boolean,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"exercise_id" uuid,
	"set_number" integer NOT NULL,
	"reps" integer,
	"weight" numeric(6, 2),
	"rpe" integer,
	"is_warmup" boolean DEFAULT false,
	"is_pr" boolean DEFAULT false,
	"rest_taken" integer,
	"notes" text,
	"performed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workout_template_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"exercise_id" uuid,
	"order_index" integer NOT NULL,
	"target_sets" integer,
	"target_reps" varchar(20),
	"target_weight" numeric(6, 2),
	"rest_seconds" integer DEFAULT 90,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"target_muscles" text[],
	"estimated_duration" integer,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount" integer NOT NULL,
	"reason" varchar(100) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boss_fights" ADD CONSTRAINT "boss_fights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boss_fights" ADD CONSTRAINT "boss_fights_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boss_fights" ADD CONSTRAINT "boss_fights_winning_set_id_workout_sets_id_fk" FOREIGN KEY ("winning_set_id") REFERENCES "public"."workout_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_cravings" ADD CONSTRAINT "food_cravings_default_food_id_foods_id_fk" FOREIGN KEY ("default_food_id") REFERENCES "public"."foods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_entries" ADD CONSTRAINT "food_entries_craving_id_food_cravings_id_fk" FOREIGN KEY ("craving_id") REFERENCES "public"."food_cravings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "morpho_profiles" ADD CONSTRAINT "morpho_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_daily_summary" ADD CONSTRAINT "nutrition_daily_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_profiles" ADD CONSTRAINT "nutrition_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_workout_set_id_workout_sets_id_fk" FOREIGN KEY ("workout_set_id") REFERENCES "public"."workout_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_measurement_id_measurements_id_fk" FOREIGN KEY ("measurement_id") REFERENCES "public"."measurements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_template_exercises" ADD CONSTRAINT "workout_template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activity_user_date" ON "activity_log" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "idx_activity_type" ON "activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_exercises_muscle" ON "exercises" USING btree ("muscle_group");--> statement-breakpoint
CREATE INDEX "idx_food_entries_user_date" ON "food_entries" USING btree ("user_id","logged_at");--> statement-breakpoint
CREATE INDEX "idx_foods_name" ON "foods" USING btree ("name_fr");--> statement-breakpoint
CREATE INDEX "idx_foods_barcode" ON "foods" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "idx_measurements_user_date" ON "measurements" USING btree ("user_id","measured_at");--> statement-breakpoint
CREATE INDEX "idx_nutrition_summary_user_date" ON "nutrition_daily_summary" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_photos_user_date" ON "progress_photos" USING btree ("user_id","taken_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_date" ON "workout_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_sets_session" ON "workout_sets" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sets_exercise" ON "workout_sets" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "idx_xp_user_date" ON "xp_transactions" USING btree ("user_id","created_at");