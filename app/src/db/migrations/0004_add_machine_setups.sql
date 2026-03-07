-- Machine setups: per-user, per-exercise machine configuration
CREATE TABLE IF NOT EXISTS "user_machine_setups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "machine_label" varchar(100) NOT NULL,
  "photo_base64" text,
  "settings" text NOT NULL DEFAULT '[]',
  "is_default" boolean DEFAULT false,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX "idx_machine_setups_user_exercise" ON "user_machine_setups" ("user_id", "exercise_id");

-- Link each set to the machine used
ALTER TABLE "workout_sets" ADD COLUMN "machine_setup_id" uuid
  REFERENCES "user_machine_setups"("id") ON DELETE SET NULL;
