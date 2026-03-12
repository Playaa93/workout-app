// Shared PowerSync schema - identical to web app
// This file must stay in sync with /app/src/powersync/schema.ts

import { column, Schema, Table } from '@powersync/react-native';

const users = new Table({
  email: column.text,
  display_name: column.text,
  avatar_url: column.text,
  created_at: column.text,
  updated_at: column.text,
  last_login_at: column.text,
  is_active: column.integer,
});

const user_settings = new Table({
  user_id: column.text,
  language: column.text,
  theme: column.text,
  notifications_enabled: column.integer,
  unit_system: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const morpho_profiles = new Table({
  user_id: column.text,
  primary_morphotype: column.text,
  secondary_morphotype: column.text,
  morphotype_score: column.text,
  wrist_circumference: column.text,
  ankle_circumference: column.text,
  bone_structure: column.text,
  torso_proportion: column.text,
  arm_proportion: column.text,
  leg_proportion: column.text,
  strengths: column.text,
  weaknesses: column.text,
  recommended_exercises: column.text,
  exercises_to_avoid: column.text,
  questionnaire_responses: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const morpho_questions = new Table({
  question_key: column.text,
  question_text_fr: column.text,
  question_type: column.text,
  options: column.text,
  order_index: column.integer,
  is_active: column.integer,
});

const measurements = new Table({
  user_id: column.text,
  measured_at: column.text,
  height: column.text,
  weight: column.text,
  body_fat_percentage: column.text,
  neck: column.text,
  shoulders: column.text,
  chest: column.text,
  left_arm: column.text,
  right_arm: column.text,
  left_forearm: column.text,
  right_forearm: column.text,
  waist: column.text,
  abdomen: column.text,
  hips: column.text,
  glutes: column.text,
  left_thigh: column.text,
  right_thigh: column.text,
  left_calf: column.text,
  right_calf: column.text,
  wrist: column.text,
  ankle: column.text,
  notes: column.text,
  created_at: column.text,
});

const progress_photos = new Table({
  user_id: column.text,
  photo_url: column.text,
  thumbnail_url: column.text,
  photo_type: column.text,
  taken_at: column.text,
  measurement_id: column.text,
  notes: column.text,
  created_at: column.text,
});

const exercises = new Table({
  name_fr: column.text,
  name_en: column.text,
  aliases: column.text,
  description: column.text,
  movement_pattern: column.text,
  exercise_type: column.text,
  muscle_group: column.text,
  primary_muscles: column.text,
  secondary_muscles: column.text,
  stabilizers: column.text,
  equipment: column.text,
  equipment_alternatives: column.text,
  good_for: column.text,
  bad_for: column.text,
  modifications: column.text,
  goal_scores: column.text,
  morpho_protocols: column.text,
  programming_priority: column.text,
  rest_modifiers: column.text,
  tempo_recommendations: column.text,
  synergies: column.text,
  antagonists: column.text,
  contraindications: column.text,
  volume_landmarks: column.text,
  difficulty: column.text,
  technique_cues: column.text,
  common_mistakes: column.text,
  instructions: column.text,
  source: column.text,
  image_url: column.text,
  video_url: column.text,
  is_custom: column.integer,
  created_by: column.text,
  created_at: column.text,
  morphotype_recommendations: column.text,
});

const workout_templates = new Table({
  user_id: column.text,
  name: column.text,
  description: column.text,
  target_muscles: column.text,
  estimated_duration: column.integer,
  is_public: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const workout_template_exercises = new Table({
  template_id: column.text,
  exercise_id: column.text,
  order_index: column.integer,
  target_sets: column.integer,
  target_reps: column.text,
  target_weight: column.text,
  rest_seconds: column.integer,
  notes: column.text,
});

const workout_sessions = new Table({
  user_id: column.text,
  template_id: column.text,
  started_at: column.text,
  ended_at: column.text,
  duration_minutes: column.integer,
  total_volume: column.text,
  calories_burned: column.integer,
  perceived_difficulty: column.integer,
  energy_level: column.integer,
  mood: column.text,
  notes: column.text,
  is_boss_fight: column.integer,
  boss_fight_completed: column.integer,
  session_type: column.text,
  cardio_activity: column.text,
  distance_meters: column.text,
  avg_pace_seconds_per_km: column.integer,
  avg_speed_kmh: column.text,
  avg_heart_rate: column.integer,
  max_heart_rate: column.integer,
  created_at: column.text,
});

const workout_sets = new Table({
  session_id: column.text,
  exercise_id: column.text,
  set_number: column.integer,
  reps: column.integer,
  weight: column.text,
  rpe: column.integer,
  is_warmup: column.integer,
  is_pr: column.integer,
  rest_taken: column.integer,
  notes: column.text,
  performed_at: column.text,
});

const cardio_intervals = new Table({
  session_id: column.text,
  interval_number: column.integer,
  duration_seconds: column.integer,
  distance_meters: column.text,
  pace_seconds_per_km: column.integer,
  heart_rate: column.integer,
  performed_at: column.text,
});

const personal_records = new Table({
  user_id: column.text,
  exercise_id: column.text,
  record_type: column.text,
  value: column.text,
  workout_set_id: column.text,
  achieved_at: column.text,
});

const foods = new Table({
  name_fr: column.text,
  name_en: column.text,
  brand: column.text,
  barcode: column.text,
  calories: column.text,
  protein: column.text,
  carbohydrates: column.text,
  fat: column.text,
  fiber: column.text,
  sugar: column.text,
  sodium: column.text,
  serving_size: column.text,
  serving_unit: column.text,
  is_custom: column.integer,
  created_by: column.text,
  verified: column.integer,
  created_at: column.text,
});

const food_cravings = new Table({
  name_fr: column.text,
  icon: column.text,
  default_food_id: column.text,
  estimated_calories: column.integer,
  category: column.text,
  is_active: column.integer,
});

const food_entries = new Table({
  user_id: column.text,
  food_id: column.text,
  craving_id: column.text,
  custom_name: column.text,
  logged_at: column.text,
  meal_type: column.text,
  quantity: column.text,
  serving_size: column.text,
  calories: column.text,
  protein: column.text,
  carbohydrates: column.text,
  fat: column.text,
  photo_url: column.text,
  recognized_by_ai: column.integer,
  ai_confidence: column.text,
  is_cheat: column.integer,
  notes: column.text,
  created_at: column.text,
});

const nutrition_daily_summary = new Table({
  user_id: column.text,
  date: column.text,
  total_calories: column.text,
  total_protein: column.text,
  total_carbs: column.text,
  total_fat: column.text,
  avg_7d_calories: column.text,
  avg_7d_protein: column.text,
  avg_7d_carbs: column.text,
  avg_7d_fat: column.text,
  entries_count: column.integer,
});

const nutrition_profiles = new Table({
  user_id: column.text,
  goal: column.text,
  activity_level: column.text,
  height: column.text,
  weight: column.text,
  age: column.integer,
  is_male: column.integer,
  tdee: column.integer,
  target_calories: column.integer,
  target_protein: column.integer,
  target_carbs: column.integer,
  target_fat: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const user_gamification = new Table({
  user_id: column.text,
  total_xp: column.integer,
  current_level: column.integer,
  xp_to_next_level: column.integer,
  current_streak: column.integer,
  longest_streak: column.integer,
  streak_freeze_available: column.integer,
  last_activity_date: column.text,
  avatar_stage: column.integer,
  avatar_customization: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const xp_transactions = new Table({
  user_id: column.text,
  amount: column.integer,
  reason: column.text,
  reference_type: column.text,
  reference_id: column.text,
  created_at: column.text,
});

const achievements = new Table({
  key: column.text,
  name_fr: column.text,
  description_fr: column.text,
  icon: column.text,
  xp_reward: column.integer,
  category: column.text,
  requirement: column.text,
  is_secret: column.integer,
});

const user_achievements = new Table({
  user_id: column.text,
  achievement_id: column.text,
  unlocked_at: column.text,
});

const boss_fights = new Table({
  user_id: column.text,
  exercise_id: column.text,
  target_weight: column.text,
  target_reps: column.integer,
  boss_name: column.text,
  boss_level: column.integer,
  status: column.text,
  attempts: column.integer,
  completed_at: column.text,
  winning_set_id: column.text,
  xp_earned: column.integer,
  created_at: column.text,
});

const activity_log = new Table({
  user_id: column.text,
  activity_type: column.text,
  activity_date: column.text,
  reference_id: column.text,
  metadata: column.text,
  created_at: column.text,
});

export const AppSchema = new Schema({
  users,
  user_settings,
  morpho_profiles,
  morpho_questions,
  measurements,
  progress_photos,
  exercises,
  workout_templates,
  workout_template_exercises,
  workout_sessions,
  workout_sets,
  cardio_intervals,
  personal_records,
  foods,
  food_cravings,
  food_entries,
  nutrition_daily_summary,
  nutrition_profiles,
  user_gamification,
  xp_transactions,
  achievements,
  user_achievements,
  boss_fights,
  activity_log,
});

export type Database = (typeof AppSchema)['types'];
