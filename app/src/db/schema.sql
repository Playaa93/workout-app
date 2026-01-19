-- =====================================================
-- WORKOUT APP - DATABASE SCHEMA
-- Neon PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    language VARCHAR(10) DEFAULT 'fr',
    theme VARCHAR(20) DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    unit_system VARCHAR(10) DEFAULT 'metric', -- 'metric' or 'imperial'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MORPHOLOGICAL ANALYSIS (Delavier/Gundill)
-- =====================================================

CREATE TYPE morphotype AS ENUM ('ectomorph', 'mesomorph', 'endomorph', 'ecto_meso', 'meso_endo', 'ecto_endo');
CREATE TYPE bone_structure AS ENUM ('fine', 'medium', 'large');
CREATE TYPE limb_proportion AS ENUM ('short', 'medium', 'long');

CREATE TABLE morpho_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Morphotype classification
    primary_morphotype morphotype NOT NULL,
    secondary_morphotype morphotype,
    morphotype_score JSONB, -- {"ecto": 0.3, "meso": 0.5, "endo": 0.2}

    -- Bone structure
    wrist_circumference DECIMAL(5,2), -- cm
    ankle_circumference DECIMAL(5,2), -- cm
    bone_structure bone_structure,

    -- Proportions
    torso_proportion limb_proportion,
    arm_proportion limb_proportion,
    leg_proportion limb_proportion,

    -- Strengths & Weaknesses
    strengths TEXT[], -- ["chest", "shoulders"]
    weaknesses TEXT[], -- ["legs", "back"]

    -- Exercise recommendations
    recommended_exercises TEXT[],
    exercises_to_avoid TEXT[],

    -- Questionnaire responses (raw data)
    questionnaire_responses JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE morpho_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_key VARCHAR(50) UNIQUE NOT NULL,
    question_text_fr TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- 'single_choice', 'multiple_choice', 'measurement', 'slider'
    options JSONB, -- For choice questions
    order_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 3. MEASUREMENTS & PHOTOS
-- =====================================================

CREATE TABLE measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Weight
    weight DECIMAL(5,2), -- kg
    body_fat_percentage DECIMAL(4,1),

    -- Circumferences (cm)
    neck DECIMAL(5,2),
    shoulders DECIMAL(5,2),
    chest DECIMAL(5,2),
    left_arm DECIMAL(5,2),
    right_arm DECIMAL(5,2),
    left_forearm DECIMAL(5,2),
    right_forearm DECIMAL(5,2),
    waist DECIMAL(5,2),
    hips DECIMAL(5,2),
    left_thigh DECIMAL(5,2),
    right_thigh DECIMAL(5,2),
    left_calf DECIMAL(5,2),
    right_calf DECIMAL(5,2),

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_measurements_user_date ON measurements(user_id, measured_at DESC);

CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    photo_type VARCHAR(20) NOT NULL, -- 'front', 'back', 'side_left', 'side_right'
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_user_date ON progress_photos(user_id, taken_at DESC);

-- =====================================================
-- 4. TRAINING
-- =====================================================

-- Exercise library
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,

    -- Categorization
    muscle_group VARCHAR(50) NOT NULL, -- 'chest', 'back', 'shoulders', 'legs', 'arms', 'core'
    secondary_muscles TEXT[],
    equipment VARCHAR(50)[], -- ['barbell', 'dumbbell', 'machine', 'bodyweight']
    difficulty VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'

    -- Morphotype suitability
    morphotype_recommendations JSONB, -- {"ectomorph": "excellent", "endomorph": "good", ...}

    -- Media
    image_url TEXT,
    video_url TEXT,
    instructions TEXT[],

    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exercises_muscle ON exercises(muscle_group);

-- Workout templates
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    target_muscles TEXT[],
    estimated_duration INT, -- minutes
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE workout_template_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    target_sets INT,
    target_reps VARCHAR(20), -- "8-12" or "10"
    target_weight DECIMAL(6,2),
    rest_seconds INT DEFAULT 90,
    notes TEXT
);

-- Workout sessions (actual workouts logged)
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INT,

    -- Overall session data
    total_volume DECIMAL(10,2), -- kg lifted total
    perceived_difficulty INT CHECK (perceived_difficulty BETWEEN 1 AND 10), -- RPE
    energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
    mood VARCHAR(20),
    notes TEXT,

    -- Boss Fight / PR Day
    is_boss_fight BOOLEAN DEFAULT FALSE,
    boss_fight_completed BOOLEAN,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_date ON workout_sessions(user_id, started_at DESC);

-- Individual sets within a workout
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,

    reps INT,
    weight DECIMAL(6,2), -- kg
    rpe INT CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    is_warmup BOOLEAN DEFAULT FALSE,
    is_pr BOOLEAN DEFAULT FALSE, -- Personal Record

    rest_taken INT, -- seconds
    notes TEXT,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sets_session ON workout_sets(session_id);
CREATE INDEX idx_sets_exercise ON workout_sets(exercise_id);

-- Personal records tracking
CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL, -- '1rm', '5rm', 'max_reps', 'max_volume'
    value DECIMAL(8,2) NOT NULL,
    workout_set_id UUID REFERENCES workout_sets(id) ON DELETE SET NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, exercise_id, record_type)
);

-- =====================================================
-- 5. NUTRITION
-- =====================================================

-- Food database
CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    brand VARCHAR(100),
    barcode VARCHAR(50),

    -- Per 100g
    calories DECIMAL(6,1),
    protein DECIMAL(5,1),
    carbohydrates DECIMAL(5,1),
    fat DECIMAL(5,1),
    fiber DECIMAL(5,1),
    sugar DECIMAL(5,1),
    sodium DECIMAL(6,1),

    serving_size DECIMAL(6,1) DEFAULT 100, -- grams
    serving_unit VARCHAR(20) DEFAULT 'g',

    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_foods_name ON foods(name_fr);
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;

-- "J'ai envie de..." quick entries
CREATE TABLE food_cravings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    default_food_id UUID REFERENCES foods(id),
    estimated_calories INT,
    category VARCHAR(50), -- 'fast_food', 'dessert', 'snack', 'drink', etc.
    is_active BOOLEAN DEFAULT TRUE
);

-- Daily food log
CREATE TABLE food_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
    craving_id UUID REFERENCES food_cravings(id) ON DELETE SET NULL,

    -- Can be manual entry without food_id
    custom_name VARCHAR(150),

    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    meal_type VARCHAR(20), -- 'breakfast', 'lunch', 'dinner', 'snack'

    -- Amounts
    quantity DECIMAL(6,2) NOT NULL DEFAULT 1,
    serving_size DECIMAL(6,1),

    -- Calculated or estimated macros
    calories DECIMAL(6,1),
    protein DECIMAL(5,1),
    carbohydrates DECIMAL(5,1),
    fat DECIMAL(5,1),

    -- Photo recognition
    photo_url TEXT,
    recognized_by_ai BOOLEAN DEFAULT FALSE,
    ai_confidence DECIMAL(3,2),

    -- Zero guilt tracking
    is_cheat BOOLEAN DEFAULT FALSE, -- User can flag, no judgment
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_food_entries_user_date ON food_entries(user_id, logged_at DESC);

-- 7-day rolling averages (invisible tracking)
CREATE TABLE nutrition_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    total_calories DECIMAL(7,1),
    total_protein DECIMAL(6,1),
    total_carbs DECIMAL(6,1),
    total_fat DECIMAL(6,1),

    -- 7-day rolling averages
    avg_7d_calories DECIMAL(7,1),
    avg_7d_protein DECIMAL(6,1),
    avg_7d_carbs DECIMAL(6,1),
    avg_7d_fat DECIMAL(6,1),

    entries_count INT DEFAULT 0,

    UNIQUE(user_id, date)
);

CREATE INDEX idx_nutrition_summary_user_date ON nutrition_daily_summary(user_id, date DESC);

-- =====================================================
-- 6. GAMIFICATION
-- =====================================================

CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- XP & Levels
    total_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    xp_to_next_level INT DEFAULT 100,

    -- Streaks (intelligent - pauses don't break them)
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    streak_freeze_available INT DEFAULT 1,
    last_activity_date DATE,

    -- Avatar
    avatar_stage INT DEFAULT 1, -- Evolution stage
    avatar_customization JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- XP transactions log
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'workout_completed', 'pr_achieved', 'streak_bonus', etc.
    reference_type VARCHAR(50), -- 'workout_session', 'measurement', etc.
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_xp_user_date ON xp_transactions(user_id, created_at DESC);

-- Achievements / Badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    description_fr TEXT,
    icon VARCHAR(10),
    xp_reward INT DEFAULT 0,
    category VARCHAR(50), -- 'training', 'nutrition', 'consistency', 'social'
    requirement JSONB, -- {"type": "workout_count", "value": 10}
    is_secret BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

-- Boss Fights (special PR challenges)
CREATE TABLE boss_fights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,

    -- Challenge
    target_weight DECIMAL(6,2),
    target_reps INT,
    boss_name VARCHAR(100),
    boss_level INT DEFAULT 1,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned'
    attempts INT DEFAULT 0,

    -- Result
    completed_at TIMESTAMP WITH TIME ZONE,
    winning_set_id UUID REFERENCES workout_sets(id),
    xp_earned INT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. ACTIVITY LOG (for analytics & Workout Wrapped)
-- =====================================================

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'workout', 'measurement', 'food_log', 'photo', 'achievement'
    activity_date DATE NOT NULL,
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_user_date ON activity_log(user_id, activity_date DESC);
CREATE INDEX idx_activity_type ON activity_log(activity_type);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_morpho_profiles_updated_at BEFORE UPDATE ON morpho_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON user_gamification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
