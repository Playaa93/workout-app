import { sqliteDb } from './database';

export function runMigrations() {
  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      display_name TEXT,
      avatar_url TEXT,
      created_at TEXT,
      updated_at TEXT,
      last_login_at TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      language TEXT DEFAULT 'fr',
      theme TEXT DEFAULT 'system',
      notifications_enabled INTEGER DEFAULT 1,
      unit_system TEXT DEFAULT 'metric',
      gemini_api_key TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS morpho_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      primary_morphotype TEXT NOT NULL,
      secondary_morphotype TEXT,
      morphotype_score TEXT,
      wrist_circumference REAL,
      ankle_circumference REAL,
      bone_structure TEXT,
      torso_proportion TEXT,
      arm_proportion TEXT,
      leg_proportion TEXT,
      strengths TEXT,
      weaknesses TEXT,
      recommended_exercises TEXT,
      exercises_to_avoid TEXT,
      questionnaire_responses TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS morpho_questions (
      id TEXT PRIMARY KEY,
      question_key TEXT UNIQUE NOT NULL,
      question_text_fr TEXT NOT NULL,
      question_type TEXT NOT NULL,
      options TEXT,
      order_index INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      measured_at TEXT,
      height REAL,
      weight REAL,
      body_fat_percentage REAL,
      neck REAL,
      shoulders REAL,
      chest REAL,
      left_arm REAL,
      right_arm REAL,
      left_forearm REAL,
      right_forearm REAL,
      waist REAL,
      abdomen REAL,
      hips REAL,
      glutes REAL,
      left_thigh REAL,
      right_thigh REAL,
      left_calf REAL,
      right_calf REAL,
      wrist REAL,
      ankle REAL,
      notes TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON measurements(user_id, measured_at);

    CREATE TABLE IF NOT EXISTS progress_photos (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      thumbnail_url TEXT,
      photo_type TEXT NOT NULL,
      taken_at TEXT,
      measurement_id TEXT REFERENCES measurements(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_photos_user_date ON progress_photos(user_id, taken_at);

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name_fr TEXT NOT NULL,
      name_en TEXT,
      aliases TEXT,
      description TEXT,
      movement_pattern TEXT DEFAULT 'isolation',
      exercise_type TEXT DEFAULT 'isolation',
      muscle_group TEXT NOT NULL,
      primary_muscles TEXT,
      secondary_muscles TEXT,
      stabilizers TEXT,
      equipment TEXT,
      equipment_alternatives TEXT,
      good_for TEXT,
      bad_for TEXT,
      modifications TEXT,
      goal_scores TEXT,
      morpho_protocols TEXT,
      programming_priority TEXT,
      rest_modifiers TEXT,
      tempo_recommendations TEXT,
      synergies TEXT,
      antagonists TEXT,
      contraindications TEXT,
      volume_landmarks TEXT,
      difficulty TEXT DEFAULT 'intermediate',
      technique_cues TEXT,
      common_mistakes TEXT,
      instructions TEXT,
      source TEXT DEFAULT 'manual',
      image_url TEXT,
      video_url TEXT,
      is_custom INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT,
      morphotype_recommendations TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON exercises(muscle_group);
    CREATE INDEX IF NOT EXISTS idx_exercises_pattern ON exercises(movement_pattern);
    CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(exercise_type);

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      target_muscles TEXT,
      estimated_duration INTEGER,
      is_public INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT REFERENCES workout_templates(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL,
      target_sets INTEGER,
      target_reps TEXT,
      target_weight REAL,
      rest_seconds INTEGER DEFAULT 90,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT REFERENCES workout_templates(id) ON DELETE SET NULL,
      started_at TEXT,
      ended_at TEXT,
      duration_minutes INTEGER,
      total_volume REAL,
      calories_burned INTEGER,
      perceived_difficulty INTEGER,
      energy_level INTEGER,
      mood TEXT,
      notes TEXT,
      is_boss_fight INTEGER DEFAULT 0,
      boss_fight_completed INTEGER,
      session_type TEXT DEFAULT 'strength',
      cardio_activity TEXT,
      distance_meters REAL,
      avg_pace_seconds_per_km INTEGER,
      avg_speed_kmh REAL,
      avg_heart_rate INTEGER,
      max_heart_rate INTEGER,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, started_at);

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight REAL,
      rpe INTEGER,
      is_warmup INTEGER DEFAULT 0,
      is_pr INTEGER DEFAULT 0,
      rest_taken INTEGER,
      notes TEXT,
      performed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id);

    CREATE TABLE IF NOT EXISTS cardio_intervals (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES workout_sessions(id) ON DELETE CASCADE,
      interval_number INTEGER NOT NULL,
      duration_seconds INTEGER,
      distance_meters REAL,
      pace_seconds_per_km INTEGER,
      heart_rate INTEGER,
      performed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_cardio_intervals_session ON cardio_intervals(session_id);

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
      record_type TEXT NOT NULL,
      value REAL NOT NULL,
      workout_set_id TEXT REFERENCES workout_sets(id) ON DELETE SET NULL,
      achieved_at TEXT,
      UNIQUE(user_id, exercise_id, record_type)
    );

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      name_fr TEXT NOT NULL,
      name_en TEXT,
      brand TEXT,
      barcode TEXT,
      calories REAL,
      protein REAL,
      carbohydrates REAL,
      fat REAL,
      fiber REAL,
      sugar REAL,
      sodium REAL,
      serving_size REAL DEFAULT 100,
      serving_unit TEXT DEFAULT 'g',
      is_custom INTEGER DEFAULT 0,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      verified INTEGER DEFAULT 0,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name_fr);
    CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);

    CREATE TABLE IF NOT EXISTS food_cravings (
      id TEXT PRIMARY KEY,
      name_fr TEXT NOT NULL,
      icon TEXT,
      default_food_id TEXT REFERENCES foods(id),
      estimated_calories INTEGER,
      category TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
      craving_id TEXT REFERENCES food_cravings(id) ON DELETE SET NULL,
      custom_name TEXT,
      logged_at TEXT,
      meal_type TEXT,
      quantity REAL NOT NULL DEFAULT 1,
      serving_size REAL,
      calories REAL,
      protein REAL,
      carbohydrates REAL,
      fat REAL,
      photo_url TEXT,
      recognized_by_ai INTEGER DEFAULT 0,
      ai_confidence REAL,
      is_cheat INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, logged_at);

    CREATE TABLE IF NOT EXISTS nutrition_daily_summary (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      total_calories REAL,
      total_protein REAL,
      total_carbs REAL,
      total_fat REAL,
      avg_7d_calories REAL,
      avg_7d_protein REAL,
      avg_7d_carbs REAL,
      avg_7d_fat REAL,
      entries_count INTEGER DEFAULT 0,
      UNIQUE(user_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_nutrition_summary_user_date ON nutrition_daily_summary(user_id, date);

    CREATE TABLE IF NOT EXISTS nutrition_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      goal TEXT DEFAULT 'maintain',
      activity_level TEXT DEFAULT 'moderate',
      height REAL,
      weight REAL,
      age INTEGER,
      is_male INTEGER DEFAULT 1,
      tdee INTEGER,
      target_calories INTEGER,
      target_protein INTEGER,
      target_carbs INTEGER,
      target_fat INTEGER,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_gamification (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      total_xp INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      xp_to_next_level INTEGER DEFAULT 100,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      streak_freeze_available INTEGER DEFAULT 1,
      last_activity_date TEXT,
      avatar_stage INTEGER DEFAULT 1,
      avatar_customization TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_xp_user_date ON xp_transactions(user_id, created_at);

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      name_fr TEXT NOT NULL,
      description_fr TEXT,
      icon TEXT,
      xp_reward INTEGER DEFAULT 0,
      category TEXT,
      requirement TEXT,
      is_secret INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TEXT,
      UNIQUE(user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS boss_fights (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
      target_weight REAL,
      target_reps INTEGER,
      boss_name TEXT,
      boss_level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      attempts INTEGER DEFAULT 0,
      completed_at TEXT,
      winning_set_id TEXT REFERENCES workout_sets(id),
      xp_earned INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      activity_date TEXT NOT NULL,
      reference_id TEXT,
      metadata TEXT,
      created_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_activity_user_date ON activity_log(user_id, activity_date);
    CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type);
  `);
}
