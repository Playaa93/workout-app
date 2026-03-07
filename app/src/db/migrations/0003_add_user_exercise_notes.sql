CREATE TABLE IF NOT EXISTS "user_exercise_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "exercise_id" uuid NOT NULL REFERENCES "exercises"("id") ON DELETE CASCADE,
  "notes" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now(),
  UNIQUE("user_id", "exercise_id")
);
