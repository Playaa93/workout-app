import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// =====================================================
// SQLite schema - adapted from PostgreSQL schema
// uuid -> text (Crypto.randomUUID())
// pgEnum -> text (app-level validation)
// jsonb / arrays -> text (JSON.stringify/parse)
// decimal -> real
// timestamp -> text (ISO 8601)
// date -> text (YYYY-MM-DD)
// =====================================================

// Enum value types (validated at application level)
export type SessionType = 'strength' | 'cardio';
export const SESSION_TYPES: SessionType[] = ['strength', 'cardio'];

export type CardioActivity = 'running' | 'walking' | 'cycling' | 'rowing' | 'jump_rope' | 'swimming' | 'elliptical' | 'stepper' | 'hiit' | 'other';
export const CARDIO_ACTIVITIES: CardioActivity[] = ['running', 'walking', 'cycling', 'rowing', 'jump_rope', 'swimming', 'elliptical', 'stepper', 'hiit', 'other'];

export type Morphotype = 'ectomorph' | 'mesomorph' | 'endomorph' | 'ecto_meso' | 'meso_endo' | 'ecto_endo';
export const MORPHOTYPES: Morphotype[] = ['ectomorph', 'mesomorph', 'endomorph', 'ecto_meso', 'meso_endo', 'ecto_endo'];

export type BoneStructure = 'fine' | 'medium' | 'large';
export type LimbProportion = 'short' | 'medium' | 'long';
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'rotation' | 'isolation';
export type ExerciseType = 'compound' | 'isolation';
export type DataSourceType = 'superphysique' | 'delavier' | 'manual' | 'combined';
export type NutritionGoal = 'bulk' | 'maintain' | 'cut';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// =====================================================
// 1. USERS & AUTHENTICATION
// =====================================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID generated via Crypto.randomUUID()
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at'), // ISO 8601
  updatedAt: text('updated_at'),
  lastLoginAt: text('last_login_at'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  language: text('language').default('fr'),
  theme: text('theme').default('system'),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).default(true),
  unitSystem: text('unit_system').default('metric'),
  geminiApiKey: text('gemini_api_key'),
  huaweiClientId: text('huawei_client_id'),
  huaweiClientSecret: text('huawei_client_secret'),
  huaweiAccessToken: text('huawei_access_token'),
  huaweiRefreshToken: text('huawei_refresh_token'),
  huaweiTokenExpiresAt: text('huawei_token_expires_at'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// =====================================================
// 2. MORPHOLOGICAL ANALYSIS
// =====================================================

export const morphoProfiles = sqliteTable('morpho_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  primaryMorphotype: text('primary_morphotype').notNull(), // Morphotype
  secondaryMorphotype: text('secondary_morphotype'), // Morphotype
  morphotypeScore: text('morphotype_score'), // JSON
  wristCircumference: real('wrist_circumference'),
  ankleCircumference: real('ankle_circumference'),
  boneStructure: text('bone_structure'), // BoneStructure
  torsoProportion: text('torso_proportion'), // LimbProportion
  armProportion: text('arm_proportion'), // LimbProportion
  legProportion: text('leg_proportion'), // LimbProportion
  strengths: text('strengths'), // JSON array
  weaknesses: text('weaknesses'), // JSON array
  recommendedExercises: text('recommended_exercises'), // JSON array
  exercisesToAvoid: text('exercises_to_avoid'), // JSON array
  questionnaireResponses: text('questionnaire_responses'), // JSON
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const morphoQuestions = sqliteTable('morpho_questions', {
  id: text('id').primaryKey(),
  questionKey: text('question_key').unique().notNull(),
  questionTextFr: text('question_text_fr').notNull(),
  questionType: text('question_type').notNull(),
  options: text('options'), // JSON
  orderIndex: integer('order_index').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// =====================================================
// 3. MEASUREMENTS & PHOTOS
// =====================================================

export const measurements = sqliteTable('measurements', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  measuredAt: text('measured_at'), // ISO 8601
  height: real('height'),
  weight: real('weight'),
  bodyFatPercentage: real('body_fat_percentage'),
  neck: real('neck'),
  shoulders: real('shoulders'),
  chest: real('chest'),
  leftArm: real('left_arm'),
  rightArm: real('right_arm'),
  leftForearm: real('left_forearm'),
  rightForearm: real('right_forearm'),
  waist: real('waist'),
  abdomen: real('abdomen'),
  hips: real('hips'),
  glutes: real('glutes'),
  leftThigh: real('left_thigh'),
  rightThigh: real('right_thigh'),
  leftCalf: real('left_calf'),
  rightCalf: real('right_calf'),
  wrist: real('wrist'),
  ankle: real('ankle'),
  notes: text('notes'),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_measurements_user_date').on(table.userId, table.measuredAt),
]);

export const progressPhotos = sqliteTable('progress_photos', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  photoUrl: text('photo_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  photoType: text('photo_type').notNull(),
  takenAt: text('taken_at'),
  measurementId: text('measurement_id').references(() => measurements.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_photos_user_date').on(table.userId, table.takenAt),
]);

// =====================================================
// 4. TRAINING
// =====================================================

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  nameFr: text('name_fr').notNull(),
  nameEn: text('name_en'),
  aliases: text('aliases'), // JSON array
  description: text('description'),
  movementPattern: text('movement_pattern'), // MovementPattern
  exerciseType: text('exercise_type'), // ExerciseType
  muscleGroup: text('muscle_group').notNull(),
  primaryMuscles: text('primary_muscles'), // JSON array
  secondaryMuscles: text('secondary_muscles'), // JSON array
  stabilizers: text('stabilizers'), // JSON array
  equipment: text('equipment'), // JSON array
  equipmentAlternatives: text('equipment_alternatives'), // JSON array
  goodFor: text('good_for'), // JSON { morphotypes: [], conditions: [] }
  badFor: text('bad_for'), // JSON
  modifications: text('modifications'), // JSON array
  goalScores: text('goal_scores'), // JSON
  morphoProtocols: text('morpho_protocols'), // JSON
  programmingPriority: text('programming_priority'),
  restModifiers: text('rest_modifiers'), // JSON
  tempoRecommendations: text('tempo_recommendations'), // JSON
  synergies: text('synergies'), // JSON array
  antagonists: text('antagonists'), // JSON array
  contraindications: text('contraindications'), // JSON array
  volumeLandmarks: text('volume_landmarks'), // JSON
  difficulty: text('difficulty').default('intermediate'),
  techniqueCues: text('technique_cues'), // JSON array
  commonMistakes: text('common_mistakes'), // JSON array
  instructions: text('instructions'), // JSON array
  source: text('source').default('manual'), // DataSourceType
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: text('created_at'),
  morphotypeRecommendations: text('morphotype_recommendations'), // JSON (legacy)
}, (table) => [
  index('idx_exercises_muscle').on(table.muscleGroup),
  index('idx_exercises_pattern').on(table.movementPattern),
  index('idx_exercises_type').on(table.exerciseType),
]);

export const workoutTemplates = sqliteTable('workout_templates', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  targetMuscles: text('target_muscles'), // JSON array
  estimatedDuration: integer('estimated_duration'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const workoutTemplateExercises = sqliteTable('workout_template_exercises', {
  id: text('id').primaryKey(),
  templateId: text('template_id').references(() => workoutTemplates.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  targetSets: integer('target_sets'),
  targetReps: text('target_reps'),
  targetWeight: real('target_weight'),
  restSeconds: integer('rest_seconds').default(90),
  notes: text('notes'),
});

export const workoutSessions = sqliteTable('workout_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  templateId: text('template_id').references(() => workoutTemplates.id, { onDelete: 'set null' }),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  durationMinutes: integer('duration_minutes'),
  totalVolume: real('total_volume'),
  caloriesBurned: integer('calories_burned'),
  perceivedDifficulty: integer('perceived_difficulty'),
  energyLevel: integer('energy_level'),
  mood: text('mood'),
  notes: text('notes'),
  isBossFight: integer('is_boss_fight', { mode: 'boolean' }).default(false),
  bossFightCompleted: integer('boss_fight_completed', { mode: 'boolean' }),
  sessionType: text('session_type').default('strength'), // SessionType
  cardioActivity: text('cardio_activity'), // CardioActivity
  distanceMeters: real('distance_meters'),
  avgPaceSecondsPerKm: integer('avg_pace_seconds_per_km'),
  avgSpeedKmh: real('avg_speed_kmh'),
  avgHeartRate: integer('avg_heart_rate'),
  maxHeartRate: integer('max_heart_rate'),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_sessions_user_date').on(table.userId, table.startedAt),
]);

export const workoutSets = sqliteTable('workout_sets', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weight: real('weight'),
  rpe: integer('rpe'),
  isWarmup: integer('is_warmup', { mode: 'boolean' }).default(false),
  isPr: integer('is_pr', { mode: 'boolean' }).default(false),
  restTaken: integer('rest_taken'),
  notes: text('notes'),
  performedAt: text('performed_at'),
}, (table) => [
  index('idx_sets_session').on(table.sessionId),
  index('idx_sets_exercise').on(table.exerciseId),
]);

export const cardioIntervals = sqliteTable('cardio_intervals', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => workoutSessions.id, { onDelete: 'cascade' }),
  intervalNumber: integer('interval_number').notNull(),
  durationSeconds: integer('duration_seconds'),
  distanceMeters: real('distance_meters'),
  paceSecondsPerKm: integer('pace_seconds_per_km'),
  heartRate: integer('heart_rate'),
  performedAt: text('performed_at'),
}, (table) => [
  index('idx_cardio_intervals_session').on(table.sessionId),
]);

export const personalRecords = sqliteTable('personal_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  recordType: text('record_type').notNull(),
  value: real('value').notNull(),
  workoutSetId: text('workout_set_id').references(() => workoutSets.id, { onDelete: 'set null' }),
  achievedAt: text('achieved_at'),
}, (table) => [
  unique().on(table.userId, table.exerciseId, table.recordType),
]);

// =====================================================
// 5. NUTRITION
// =====================================================

export const foods = sqliteTable('foods', {
  id: text('id').primaryKey(),
  nameFr: text('name_fr').notNull(),
  nameEn: text('name_en'),
  brand: text('brand'),
  barcode: text('barcode'),
  calories: real('calories'),
  protein: real('protein'),
  carbohydrates: real('carbohydrates'),
  fat: real('fat'),
  fiber: real('fiber'),
  sugar: real('sugar'),
  sodium: real('sodium'),
  servingSize: real('serving_size').default(100),
  servingUnit: text('serving_unit').default('g'),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  verified: integer('verified', { mode: 'boolean' }).default(false),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_foods_name').on(table.nameFr),
  index('idx_foods_barcode').on(table.barcode),
]);

export const foodCravings = sqliteTable('food_cravings', {
  id: text('id').primaryKey(),
  nameFr: text('name_fr').notNull(),
  icon: text('icon'),
  defaultFoodId: text('default_food_id').references(() => foods.id),
  estimatedCalories: integer('estimated_calories'),
  category: text('category'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

export const foodEntries = sqliteTable('food_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  foodId: text('food_id').references(() => foods.id, { onDelete: 'set null' }),
  cravingId: text('craving_id').references(() => foodCravings.id, { onDelete: 'set null' }),
  customName: text('custom_name'),
  loggedAt: text('logged_at'),
  mealType: text('meal_type'),
  quantity: real('quantity').notNull().default(1),
  servingSize: real('serving_size'),
  calories: real('calories'),
  protein: real('protein'),
  carbohydrates: real('carbohydrates'),
  fat: real('fat'),
  photoUrl: text('photo_url'),
  recognizedByAi: integer('recognized_by_ai', { mode: 'boolean' }).default(false),
  aiConfidence: real('ai_confidence'),
  isCheat: integer('is_cheat', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_food_entries_user_date').on(table.userId, table.loggedAt),
]);

export const nutritionDailySummary = sqliteTable('nutrition_daily_summary', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  totalCalories: real('total_calories'),
  totalProtein: real('total_protein'),
  totalCarbs: real('total_carbs'),
  totalFat: real('total_fat'),
  avg7dCalories: real('avg_7d_calories'),
  avg7dProtein: real('avg_7d_protein'),
  avg7dCarbs: real('avg_7d_carbs'),
  avg7dFat: real('avg_7d_fat'),
  entriesCount: integer('entries_count').default(0),
}, (table) => [
  unique().on(table.userId, table.date),
  index('idx_nutrition_summary_user_date').on(table.userId, table.date),
]);

export const nutritionProfiles = sqliteTable('nutrition_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  goal: text('goal').default('maintain'), // NutritionGoal
  activityLevel: text('activity_level').default('moderate'), // ActivityLevel
  height: real('height'),
  weight: real('weight'),
  age: integer('age'),
  isMale: integer('is_male', { mode: 'boolean' }).default(true),
  tdee: integer('tdee'),
  targetCalories: integer('target_calories'),
  targetProtein: integer('target_protein'),
  targetCarbs: integer('target_carbs'),
  targetFat: integer('target_fat'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// =====================================================
// 6. GAMIFICATION
// =====================================================

export const userGamification = sqliteTable('user_gamification', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  totalXp: integer('total_xp').default(0),
  currentLevel: integer('current_level').default(1),
  xpToNextLevel: integer('xp_to_next_level').default(100),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  streakFreezeAvailable: integer('streak_freeze_available').default(1),
  lastActivityDate: text('last_activity_date'), // YYYY-MM-DD
  avatarStage: integer('avatar_stage').default(1),
  avatarCustomization: text('avatar_customization'), // JSON
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const xpTransactions = sqliteTable('xp_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  createdAt: text('created_at'),
}, (table) => [
  index('idx_xp_user_date').on(table.userId, table.createdAt),
]);

export const achievements = sqliteTable('achievements', {
  id: text('id').primaryKey(),
  key: text('key').unique().notNull(),
  nameFr: text('name_fr').notNull(),
  descriptionFr: text('description_fr'),
  icon: text('icon'),
  xpReward: integer('xp_reward').default(0),
  category: text('category'),
  requirement: text('requirement'), // JSON
  isSecret: integer('is_secret', { mode: 'boolean' }).default(false),
});

export const userAchievements = sqliteTable('user_achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  achievementId: text('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: text('unlocked_at'),
}, (table) => [
  unique().on(table.userId, table.achievementId),
]);

export const bossFights = sqliteTable('boss_fights', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  targetWeight: real('target_weight'),
  targetReps: integer('target_reps'),
  bossName: text('boss_name'),
  bossLevel: integer('boss_level').default(1),
  status: text('status').default('active'),
  attempts: integer('attempts').default(0),
  completedAt: text('completed_at'),
  winningSetId: text('winning_set_id').references(() => workoutSets.id),
  xpEarned: integer('xp_earned'),
  createdAt: text('created_at'),
});

// =====================================================
// 7. ACTIVITY LOG
// =====================================================

export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  activityType: text('activity_type').notNull(),
  activityDate: text('activity_date').notNull(), // YYYY-MM-DD
  referenceId: text('reference_id'),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at'),
}, (table) => [
  index('idx_activity_user_date').on(table.userId, table.activityDate),
  index('idx_activity_type').on(table.activityType),
]);

// =====================================================
// RELATIONS
// =====================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  morphoProfile: one(morphoProfiles, {
    fields: [users.id],
    references: [morphoProfiles.userId],
  }),
  gamification: one(userGamification, {
    fields: [users.id],
    references: [userGamification.userId],
  }),
  measurements: many(measurements),
  progressPhotos: many(progressPhotos),
  workoutSessions: many(workoutSessions),
  workoutTemplates: many(workoutTemplates),
  foodEntries: many(foodEntries),
  xpTransactions: many(xpTransactions),
  achievements: many(userAchievements),
  bossFights: many(bossFights),
  activityLog: many(activityLog),
}));

export const workoutSessionsRelations = relations(workoutSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [workoutSessions.userId],
    references: [users.id],
  }),
  template: one(workoutTemplates, {
    fields: [workoutSessions.templateId],
    references: [workoutTemplates.id],
  }),
  sets: many(workoutSets),
  cardioIntervals: many(cardioIntervals),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [workoutSets.sessionId],
    references: [workoutSessions.id],
  }),
  exercise: one(exercises, {
    fields: [workoutSets.exerciseId],
    references: [exercises.id],
  }),
}));

export const cardioIntervalsRelations = relations(cardioIntervals, ({ one }) => ({
  session: one(workoutSessions, {
    fields: [cardioIntervals.sessionId],
    references: [workoutSessions.id],
  }),
}));

export const foodEntriesRelations = relations(foodEntries, ({ one }) => ({
  user: one(users, {
    fields: [foodEntries.userId],
    references: [users.id],
  }),
  food: one(foods, {
    fields: [foodEntries.foodId],
    references: [foods.id],
  }),
  craving: one(foodCravings, {
    fields: [foodEntries.cravingId],
    references: [foodCravings.id],
  }),
}));

// =====================================================
// TYPE EXPORTS
// =====================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type MorphoProfile = typeof morphoProfiles.$inferSelect;
export type Measurement = typeof measurements.$inferSelect;
export type NewMeasurement = typeof measurements.$inferInsert;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
export type PersonalRecord = typeof personalRecords.$inferSelect;
export type CardioInterval = typeof cardioIntervals.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type FoodCraving = typeof foodCravings.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NewFoodEntry = typeof foodEntries.$inferInsert;
export type NutritionDailySummary = typeof nutritionDailySummary.$inferSelect;
export type NutritionProfile = typeof nutritionProfiles.$inferSelect;
export type NewNutritionProfile = typeof nutritionProfiles.$inferInsert;
export type UserGamification = typeof userGamification.$inferSelect;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type BossFight = typeof bossFights.$inferSelect;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
