-- =====================================================
-- MIGRATION: Enrich Exercises Table
-- Add new fields for SuperPhysique/Delavier methodology
-- =====================================================

-- Create new enum types
DO $$ BEGIN
    CREATE TYPE movement_pattern AS ENUM (
        'push', 'pull', 'squat', 'hinge', 'lunge', 'carry', 'rotation', 'isolation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exercise_type AS ENUM ('compound', 'isolation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source AS ENUM ('superphysique', 'delavier', 'manual', 'combined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS movement_pattern movement_pattern DEFAULT 'isolation',
ADD COLUMN IF NOT EXISTS exercise_type exercise_type DEFAULT 'isolation',
ADD COLUMN IF NOT EXISTS primary_muscles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stabilizers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_alternatives VARCHAR(50)[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS good_for JSONB DEFAULT '{"morphotypes": [], "conditions": []}',
ADD COLUMN IF NOT EXISTS bad_for JSONB DEFAULT '{"morphotypes": [], "conditions": []}',
ADD COLUMN IF NOT EXISTS modifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS technique_cues TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS common_mistakes TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source data_source DEFAULT 'manual';

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_exercises_pattern ON exercises(movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_source ON exercises(source);

-- Update existing exercises with default values for new fields
-- (This maps old muscle_group to new primary_muscles and sets movement patterns)

-- Map chest exercises
UPDATE exercises SET
    movement_pattern = 'push',
    exercise_type = 'compound',
    primary_muscles = ARRAY['pec_major_sternal', 'pec_major_clavicular'],
    source = 'manual'
WHERE muscle_group = 'chest'
  AND (name_fr ILIKE '%développé%' OR name_fr ILIKE '%dips%' OR name_fr ILIKE '%pompes%')
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['pec_major_sternal'],
    source = 'manual'
WHERE muscle_group = 'chest'
  AND (name_fr ILIKE '%écarté%' OR name_fr ILIKE '%poulie%' OR name_fr ILIKE '%pec deck%')
  AND movement_pattern IS NULL;

-- Map back exercises
UPDATE exercises SET
    movement_pattern = 'pull',
    exercise_type = 'compound',
    primary_muscles = ARRAY['latissimus_dorsi', 'rhomboids'],
    source = 'manual'
WHERE muscle_group = 'back'
  AND (name_fr ILIKE '%traction%' OR name_fr ILIKE '%tirage%' OR name_fr ILIKE '%rowing%')
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'hinge',
    exercise_type = 'compound',
    primary_muscles = ARRAY['erector_spinae', 'gluteus_maximus', 'hamstrings_biceps_femoris'],
    source = 'manual'
WHERE muscle_group = 'back'
  AND name_fr ILIKE '%soulevé de terre%'
  AND movement_pattern IS NULL;

-- Map shoulder exercises
UPDATE exercises SET
    movement_pattern = 'push',
    exercise_type = 'compound',
    primary_muscles = ARRAY['anterior_delt', 'lateral_delt'],
    source = 'manual'
WHERE muscle_group = 'shoulders'
  AND (name_fr ILIKE '%développé%' OR name_fr ILIKE '%arnold%')
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['lateral_delt'],
    source = 'manual'
WHERE muscle_group = 'shoulders'
  AND name_fr ILIKE '%élévation%latérale%'
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'pull',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['posterior_delt'],
    source = 'manual'
WHERE muscle_group = 'shoulders'
  AND (name_fr ILIKE '%oiseau%' OR name_fr ILIKE '%face pull%' OR name_fr ILIKE '%rear delt%')
  AND movement_pattern IS NULL;

-- Map leg exercises
UPDATE exercises SET
    movement_pattern = 'squat',
    exercise_type = 'compound',
    primary_muscles = ARRAY['quadriceps_rectus_femoris', 'quadriceps_vastus_lateralis', 'gluteus_maximus'],
    source = 'manual'
WHERE muscle_group = 'legs'
  AND (name_fr ILIKE '%squat%' OR name_fr ILIKE '%presse%')
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'lunge',
    exercise_type = 'compound',
    primary_muscles = ARRAY['quadriceps_rectus_femoris', 'gluteus_maximus'],
    source = 'manual'
WHERE muscle_group = 'legs'
  AND name_fr ILIKE '%fente%'
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'hinge',
    exercise_type = 'compound',
    primary_muscles = ARRAY['hamstrings_biceps_femoris', 'gluteus_maximus'],
    source = 'manual'
WHERE muscle_group = 'legs'
  AND (name_fr ILIKE '%hip thrust%' OR name_fr ILIKE '%soulevé%jambes%')
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['quadriceps_rectus_femoris'],
    source = 'manual'
WHERE muscle_group = 'legs'
  AND name_fr ILIKE '%leg extension%'
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['hamstrings_biceps_femoris'],
    source = 'manual'
WHERE muscle_group = 'legs'
  AND name_fr ILIKE '%leg curl%'
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['calves_gastrocnemius'],
    source = 'manual'
WHERE muscle_group = 'legs'
  AND name_fr ILIKE '%mollet%'
  AND movement_pattern IS NULL;

-- Map arm exercises
UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['biceps_long_head', 'biceps_short_head'],
    source = 'manual'
WHERE muscle_group = 'arms'
  AND name_fr ILIKE '%curl%'
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['triceps_long_head', 'triceps_lateral_head'],
    source = 'manual'
WHERE muscle_group = 'arms'
  AND (name_fr ILIKE '%triceps%' OR name_fr ILIKE '%extension%' OR name_fr ILIKE '%barre au front%')
  AND movement_pattern IS NULL;

UPDATE exercises SET
    movement_pattern = 'push',
    exercise_type = 'compound',
    primary_muscles = ARRAY['triceps_long_head', 'triceps_lateral_head'],
    source = 'manual'
WHERE muscle_group = 'arms'
  AND (name_fr ILIKE '%dips%' OR name_fr ILIKE '%développé%serré%')
  AND movement_pattern IS NULL;

-- Map core exercises
UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY['rectus_abdominis'],
    source = 'manual'
WHERE muscle_group = 'core'
  AND movement_pattern IS NULL;

-- Map full body exercises
UPDATE exercises SET
    movement_pattern = 'hinge',
    exercise_type = 'compound',
    primary_muscles = ARRAY['gluteus_maximus', 'quadriceps_rectus_femoris'],
    source = 'manual'
WHERE muscle_group = 'full_body'
  AND movement_pattern IS NULL;

-- Set any remaining NULL values to defaults
UPDATE exercises SET
    movement_pattern = 'isolation',
    exercise_type = 'isolation',
    primary_muscles = ARRAY[]::TEXT[],
    source = 'manual'
WHERE movement_pattern IS NULL;

-- =====================================================
-- DONE
-- =====================================================
