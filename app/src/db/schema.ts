import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  jsonb,
  date,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =====================================================
// ENUMS
// =====================================================

export const morphotypeEnum = pgEnum('morphotype', [
  'ectomorph',
  'mesomorph',
  'endomorph',
  'ecto_meso',
  'meso_endo',
  'ecto_endo',
]);

export const boneStructureEnum = pgEnum('bone_structure', ['fine', 'medium', 'large']);

export const limbProportionEnum = pgEnum('limb_proportion', ['short', 'medium', 'long']);

// =====================================================
// 1. USERS & AUTHENTICATION
// =====================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  language: varchar('language', { length: 10 }).default('fr'),
  theme: varchar('theme', { length: 20 }).default('system'),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  unitSystem: varchar('unit_system', { length: 10 }).default('metric'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// =====================================================
// 2. MORPHOLOGICAL ANALYSIS
// =====================================================

export const morphoProfiles = pgTable('morpho_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  primaryMorphotype: morphotypeEnum('primary_morphotype').notNull(),
  secondaryMorphotype: morphotypeEnum('secondary_morphotype'),
  morphotypeScore: jsonb('morphotype_score'),
  wristCircumference: decimal('wrist_circumference', { precision: 5, scale: 2 }),
  ankleCircumference: decimal('ankle_circumference', { precision: 5, scale: 2 }),
  boneStructure: boneStructureEnum('bone_structure'),
  torsoProportion: limbProportionEnum('torso_proportion'),
  armProportion: limbProportionEnum('arm_proportion'),
  legProportion: limbProportionEnum('leg_proportion'),
  strengths: text('strengths').array(),
  weaknesses: text('weaknesses').array(),
  recommendedExercises: text('recommended_exercises').array(),
  exercisesToAvoid: text('exercises_to_avoid').array(),
  questionnaireResponses: jsonb('questionnaire_responses'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const morphoQuestions = pgTable('morpho_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionKey: varchar('question_key', { length: 50 }).unique().notNull(),
  questionTextFr: text('question_text_fr').notNull(),
  questionType: varchar('question_type', { length: 20 }).notNull(),
  options: jsonb('options'),
  orderIndex: integer('order_index').notNull(),
  isActive: boolean('is_active').default(true),
});

// =====================================================
// 3. MEASUREMENTS & PHOTOS
// =====================================================

export const measurements = pgTable(
  'measurements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    measuredAt: timestamp('measured_at', { withTimezone: true }).defaultNow(),
    weight: decimal('weight', { precision: 5, scale: 2 }),
    bodyFatPercentage: decimal('body_fat_percentage', { precision: 4, scale: 1 }),
    neck: decimal('neck', { precision: 5, scale: 2 }),
    shoulders: decimal('shoulders', { precision: 5, scale: 2 }),
    chest: decimal('chest', { precision: 5, scale: 2 }),
    leftArm: decimal('left_arm', { precision: 5, scale: 2 }),
    rightArm: decimal('right_arm', { precision: 5, scale: 2 }),
    leftForearm: decimal('left_forearm', { precision: 5, scale: 2 }),
    rightForearm: decimal('right_forearm', { precision: 5, scale: 2 }),
    waist: decimal('waist', { precision: 5, scale: 2 }),
    hips: decimal('hips', { precision: 5, scale: 2 }),
    leftThigh: decimal('left_thigh', { precision: 5, scale: 2 }),
    rightThigh: decimal('right_thigh', { precision: 5, scale: 2 }),
    leftCalf: decimal('left_calf', { precision: 5, scale: 2 }),
    rightCalf: decimal('right_calf', { precision: 5, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_measurements_user_date').on(table.userId, table.measuredAt)]
);

export const progressPhotos = pgTable(
  'progress_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    photoUrl: text('photo_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    photoType: varchar('photo_type', { length: 20 }).notNull(),
    takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow(),
    measurementId: uuid('measurement_id').references(() => measurements.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_photos_user_date').on(table.userId, table.takenAt)]
);

// =====================================================
// 4. TRAINING
// =====================================================

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nameFr: varchar('name_fr', { length: 100 }).notNull(),
    nameEn: varchar('name_en', { length: 100 }),
    description: text('description'),
    muscleGroup: varchar('muscle_group', { length: 50 }).notNull(),
    secondaryMuscles: text('secondary_muscles').array(),
    equipment: varchar('equipment', { length: 50 }).array(),
    difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
    morphotypeRecommendations: jsonb('morphotype_recommendations'),
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    instructions: text('instructions').array(),
    isCustom: boolean('is_custom').default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_exercises_muscle').on(table.muscleGroup)]
);

export const workoutTemplates = pgTable('workout_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  targetMuscles: text('target_muscles').array(),
  estimatedDuration: integer('estimated_duration'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const workoutTemplateExercises = pgTable('workout_template_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => workoutTemplates.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  targetSets: integer('target_sets'),
  targetReps: varchar('target_reps', { length: 20 }),
  targetWeight: decimal('target_weight', { precision: 6, scale: 2 }),
  restSeconds: integer('rest_seconds').default(90),
  notes: text('notes'),
});

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => workoutTemplates.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationMinutes: integer('duration_minutes'),
    totalVolume: decimal('total_volume', { precision: 10, scale: 2 }),
    perceivedDifficulty: integer('perceived_difficulty'),
    energyLevel: integer('energy_level'),
    mood: varchar('mood', { length: 20 }),
    notes: text('notes'),
    isBossFight: boolean('is_boss_fight').default(false),
    bossFightCompleted: boolean('boss_fight_completed'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_sessions_user_date').on(table.userId, table.startedAt)]
);

export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    reps: integer('reps'),
    weight: decimal('weight', { precision: 6, scale: 2 }),
    rpe: integer('rpe'),
    isWarmup: boolean('is_warmup').default(false),
    isPr: boolean('is_pr').default(false),
    restTaken: integer('rest_taken'),
    notes: text('notes'),
    performedAt: timestamp('performed_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_sets_session').on(table.sessionId),
    index('idx_sets_exercise').on(table.exerciseId),
  ]
);

export const personalRecords = pgTable(
  'personal_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
    recordType: varchar('record_type', { length: 20 }).notNull(),
    value: decimal('value', { precision: 8, scale: 2 }).notNull(),
    workoutSetId: uuid('workout_set_id').references(() => workoutSets.id, { onDelete: 'set null' }),
    achievedAt: timestamp('achieved_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.userId, table.exerciseId, table.recordType)]
);

// =====================================================
// 5. NUTRITION
// =====================================================

export const foods = pgTable(
  'foods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nameFr: varchar('name_fr', { length: 150 }).notNull(),
    nameEn: varchar('name_en', { length: 150 }),
    brand: varchar('brand', { length: 100 }),
    barcode: varchar('barcode', { length: 50 }),
    calories: decimal('calories', { precision: 6, scale: 1 }),
    protein: decimal('protein', { precision: 5, scale: 1 }),
    carbohydrates: decimal('carbohydrates', { precision: 5, scale: 1 }),
    fat: decimal('fat', { precision: 5, scale: 1 }),
    fiber: decimal('fiber', { precision: 5, scale: 1 }),
    sugar: decimal('sugar', { precision: 5, scale: 1 }),
    sodium: decimal('sodium', { precision: 6, scale: 1 }),
    servingSize: decimal('serving_size', { precision: 6, scale: 1 }).default('100'),
    servingUnit: varchar('serving_unit', { length: 20 }).default('g'),
    isCustom: boolean('is_custom').default(false),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    verified: boolean('verified').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_foods_name').on(table.nameFr),
    index('idx_foods_barcode').on(table.barcode),
  ]
);

export const foodCravings = pgTable('food_cravings', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameFr: varchar('name_fr', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 10 }),
  defaultFoodId: uuid('default_food_id').references(() => foods.id),
  estimatedCalories: integer('estimated_calories'),
  category: varchar('category', { length: 50 }),
  isActive: boolean('is_active').default(true),
});

export const foodEntries = pgTable(
  'food_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    foodId: uuid('food_id').references(() => foods.id, { onDelete: 'set null' }),
    cravingId: uuid('craving_id').references(() => foodCravings.id, { onDelete: 'set null' }),
    customName: varchar('custom_name', { length: 150 }),
    loggedAt: timestamp('logged_at', { withTimezone: true }).defaultNow(),
    mealType: varchar('meal_type', { length: 20 }),
    quantity: decimal('quantity', { precision: 6, scale: 2 }).notNull().default('1'),
    servingSize: decimal('serving_size', { precision: 6, scale: 1 }),
    calories: decimal('calories', { precision: 6, scale: 1 }),
    protein: decimal('protein', { precision: 5, scale: 1 }),
    carbohydrates: decimal('carbohydrates', { precision: 5, scale: 1 }),
    fat: decimal('fat', { precision: 5, scale: 1 }),
    photoUrl: text('photo_url'),
    recognizedByAi: boolean('recognized_by_ai').default(false),
    aiConfidence: decimal('ai_confidence', { precision: 3, scale: 2 }),
    isCheat: boolean('is_cheat').default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_food_entries_user_date').on(table.userId, table.loggedAt)]
);

export const nutritionDailySummary = pgTable(
  'nutrition_daily_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    totalCalories: decimal('total_calories', { precision: 7, scale: 1 }),
    totalProtein: decimal('total_protein', { precision: 6, scale: 1 }),
    totalCarbs: decimal('total_carbs', { precision: 6, scale: 1 }),
    totalFat: decimal('total_fat', { precision: 6, scale: 1 }),
    avg7dCalories: decimal('avg_7d_calories', { precision: 7, scale: 1 }),
    avg7dProtein: decimal('avg_7d_protein', { precision: 6, scale: 1 }),
    avg7dCarbs: decimal('avg_7d_carbs', { precision: 6, scale: 1 }),
    avg7dFat: decimal('avg_7d_fat', { precision: 6, scale: 1 }),
    entriesCount: integer('entries_count').default(0),
  },
  (table) => [
    unique().on(table.userId, table.date),
    index('idx_nutrition_summary_user_date').on(table.userId, table.date),
  ]
);

// =====================================================
// 6. GAMIFICATION
// =====================================================

export const userGamification = pgTable('user_gamification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  totalXp: integer('total_xp').default(0),
  currentLevel: integer('current_level').default(1),
  xpToNextLevel: integer('xp_to_next_level').default(100),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  streakFreezeAvailable: integer('streak_freeze_available').default(1),
  lastActivityDate: date('last_activity_date'),
  avatarStage: integer('avatar_stage').default(1),
  avatarCustomization: jsonb('avatar_customization'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const xpTransactions = pgTable(
  'xp_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: varchar('reason', { length: 100 }).notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_xp_user_date').on(table.userId, table.createdAt)]
);

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 50 }).unique().notNull(),
  nameFr: varchar('name_fr', { length: 100 }).notNull(),
  descriptionFr: text('description_fr'),
  icon: varchar('icon', { length: 10 }),
  xpReward: integer('xp_reward').default(0),
  category: varchar('category', { length: 50 }),
  requirement: jsonb('requirement'),
  isSecret: boolean('is_secret').default(false),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id').references(() => achievements.id, { onDelete: 'cascade' }),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.userId, table.achievementId)]
);

export const bossFights = pgTable('boss_fights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').references(() => exercises.id, { onDelete: 'cascade' }),
  targetWeight: decimal('target_weight', { precision: 6, scale: 2 }),
  targetReps: integer('target_reps'),
  bossName: varchar('boss_name', { length: 100 }),
  bossLevel: integer('boss_level').default(1),
  status: varchar('status', { length: 20 }).default('active'),
  attempts: integer('attempts').default(0),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  winningSetId: uuid('winning_set_id').references(() => workoutSets.id),
  xpEarned: integer('xp_earned'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// =====================================================
// 7. ACTIVITY LOG
// =====================================================

export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    activityDate: date('activity_date').notNull(),
    referenceId: uuid('reference_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_activity_user_date').on(table.userId, table.activityDate),
    index('idx_activity_type').on(table.activityType),
  ]
);

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
export type MorphoQuestion = typeof morphoQuestions.$inferSelect;

export type Measurement = typeof measurements.$inferSelect;
export type NewMeasurement = typeof measurements.$inferInsert;
export type ProgressPhoto = typeof progressPhotos.$inferSelect;

export type Exercise = typeof exercises.$inferSelect;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
export type PersonalRecord = typeof personalRecords.$inferSelect;

export type Food = typeof foods.$inferSelect;
export type FoodCraving = typeof foodCravings.$inferSelect;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type NewFoodEntry = typeof foodEntries.$inferInsert;
export type NutritionDailySummary = typeof nutritionDailySummary.$inferSelect;

export type UserGamification = typeof userGamification.$inferSelect;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type BossFight = typeof bossFights.$inferSelect;

export type ActivityLogEntry = typeof activityLog.$inferSelect;
