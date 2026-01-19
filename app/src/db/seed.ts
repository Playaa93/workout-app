import postgres from 'postgres';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_EBZRvdhi6l2g@ep-cold-cherry-abb86rz2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

const sql = postgres(DATABASE_URL, { ssl: 'require' });

// =====================================================
// MORPHO QUESTIONS (Delavier/Gundill style)
// =====================================================

const morphoQuestions = [
  {
    question_key: 'wrist_size',
    question_text_fr:
      "Mesurez votre tour de poignet (main dominante) au niveau le plus fin. Quel est le résultat ?",
    question_type: 'measurement',
    options: JSON.stringify({
      unit: 'cm',
      ranges: [
        { label: '< 16 cm', value: 'fine' },
        { label: '16-18 cm', value: 'medium' },
        { label: '> 18 cm', value: 'large' },
      ],
    }),
    order_index: 1,
  },
  {
    question_key: 'shoulder_width',
    question_text_fr: 'Comment qualifieriez-vous la largeur de vos épaules naturellement ?',
    question_type: 'single_choice',
    options: JSON.stringify([
      { label: 'Étroites', value: 'narrow', morpho_impact: { ecto: 2, meso: 0, endo: 0 } },
      { label: 'Moyennes', value: 'medium', morpho_impact: { ecto: 0, meso: 1, endo: 1 } },
      { label: 'Larges', value: 'wide', morpho_impact: { ecto: 0, meso: 2, endo: 1 } },
    ]),
    order_index: 2,
  },
  {
    question_key: 'hip_shoulder_ratio',
    question_text_fr: 'En comparant vos hanches à vos épaules :',
    question_type: 'single_choice',
    options: JSON.stringify([
      {
        label: 'Hanches plus étroites que les épaules',
        value: 'narrow_hips',
        morpho_impact: { ecto: 1, meso: 2, endo: 0 },
      },
      {
        label: 'Hanches à peu près égales aux épaules',
        value: 'equal',
        morpho_impact: { ecto: 1, meso: 1, endo: 1 },
      },
      {
        label: 'Hanches plus larges que les épaules',
        value: 'wide_hips',
        morpho_impact: { ecto: 0, meso: 0, endo: 2 },
      },
    ]),
    order_index: 3,
  },
  {
    question_key: 'weight_gain_tendency',
    question_text_fr: 'Comment votre corps réagit-il à un excès calorique ?',
    question_type: 'single_choice',
    options: JSON.stringify([
      {
        label: 'Je prends très difficilement du poids',
        value: 'hard_gainer',
        morpho_impact: { ecto: 3, meso: 0, endo: 0 },
      },
      {
        label: 'Je prends du muscle et du gras de façon équilibrée',
        value: 'balanced',
        morpho_impact: { ecto: 0, meso: 2, endo: 1 },
      },
      {
        label: 'Je stocke facilement de la graisse',
        value: 'easy_gainer',
        morpho_impact: { ecto: 0, meso: 0, endo: 3 },
      },
    ]),
    order_index: 4,
  },
  {
    question_key: 'natural_strength',
    question_text_fr: 'Avant tout entraînement, vous étiez naturellement :',
    question_type: 'single_choice',
    options: JSON.stringify([
      { label: 'Plutôt faible', value: 'weak', morpho_impact: { ecto: 2, meso: 0, endo: 1 } },
      { label: 'Dans la moyenne', value: 'average', morpho_impact: { ecto: 1, meso: 1, endo: 1 } },
      {
        label: 'Naturellement fort',
        value: 'strong',
        morpho_impact: { ecto: 0, meso: 2, endo: 1 },
      },
    ]),
    order_index: 5,
  },
  {
    question_key: 'torso_length',
    question_text_fr: 'En position assise, comment est votre buste par rapport à vos jambes ?',
    question_type: 'single_choice',
    options: JSON.stringify([
      { label: 'Buste court', value: 'short', proportion: 'short_torso' },
      { label: 'Proportionnel', value: 'medium', proportion: 'medium_torso' },
      { label: 'Buste long', value: 'long', proportion: 'long_torso' },
    ]),
    order_index: 6,
  },
  {
    question_key: 'arm_length',
    question_text_fr: 'Debout, bras le long du corps, où arrivent vos doigts ?',
    question_type: 'single_choice',
    options: JSON.stringify([
      { label: 'Au-dessus de mi-cuisse', value: 'short', proportion: 'short_arms' },
      { label: 'À mi-cuisse', value: 'medium', proportion: 'medium_arms' },
      { label: 'En dessous de mi-cuisse', value: 'long', proportion: 'long_arms' },
    ]),
    order_index: 7,
  },
  {
    question_key: 'muscle_insertions',
    question_text_fr: 'Quand vous contractez votre biceps, comment est-il ?',
    question_type: 'single_choice',
    options: JSON.stringify([
      { label: 'Court avec un pic prononcé', value: 'short', morpho_impact: { ecto: 2, meso: 1, endo: 0 } },
      { label: 'Moyen, forme classique', value: 'medium', morpho_impact: { ecto: 1, meso: 1, endo: 1 } },
      { label: 'Long et plein', value: 'long', morpho_impact: { ecto: 0, meso: 2, endo: 1 } },
    ]),
    order_index: 8,
  },
];

// =====================================================
// EXERCISES (100+ exercises library)
// =====================================================

const exercises = [
  // CHEST
  {
    name_fr: 'Développé couché barre',
    name_en: 'Barbell Bench Press',
    muscle_group: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    instructions: [
      'Allongez-vous sur le banc, pieds au sol',
      'Saisissez la barre avec une prise légèrement plus large que les épaules',
      'Descendez la barre contrôlée vers le milieu de la poitrine',
      'Poussez explosif vers le haut',
    ],
    morphotype_recommendations: JSON.stringify({
      ectomorph: 'excellent',
      mesomorph: 'excellent',
      endomorph: 'good',
    }),
  },
  {
    name_fr: 'Développé couché haltères',
    name_en: 'Dumbbell Bench Press',
    muscle_group: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    morphotype_recommendations: JSON.stringify({
      ectomorph: 'excellent',
      mesomorph: 'excellent',
      endomorph: 'excellent',
    }),
  },
  {
    name_fr: 'Développé incliné barre',
    name_en: 'Incline Barbell Press',
    muscle_group: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['barbell', 'incline_bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Développé incliné haltères',
    name_en: 'Incline Dumbbell Press',
    muscle_group: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['dumbbell', 'incline_bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Développé décliné',
    name_en: 'Decline Press',
    muscle_group: 'chest',
    secondary_muscles: ['triceps'],
    equipment: ['barbell', 'decline_bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Écarté couché haltères',
    name_en: 'Dumbbell Fly',
    muscle_group: 'chest',
    secondary_muscles: [],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Écarté incliné haltères',
    name_en: 'Incline Dumbbell Fly',
    muscle_group: 'chest',
    secondary_muscles: [],
    equipment: ['dumbbell', 'incline_bench'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Poulie vis-à-vis',
    name_en: 'Cable Crossover',
    muscle_group: 'chest',
    secondary_muscles: [],
    equipment: ['cable'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Pompes',
    name_en: 'Push-ups',
    muscle_group: 'chest',
    secondary_muscles: ['triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Dips pectoraux',
    name_en: 'Chest Dips',
    muscle_group: 'chest',
    secondary_muscles: ['triceps', 'shoulders'],
    equipment: ['dip_bars'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Pec deck (machine)',
    name_en: 'Pec Deck Machine',
    muscle_group: 'chest',
    secondary_muscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
  },

  // BACK
  {
    name_fr: 'Tractions pronation',
    name_en: 'Pull-ups',
    muscle_group: 'back',
    secondary_muscles: ['biceps', 'forearms'],
    equipment: ['pull_up_bar'],
    difficulty: 'intermediate',
    morphotype_recommendations: JSON.stringify({
      ectomorph: 'excellent',
      mesomorph: 'good',
      endomorph: 'challenging',
    }),
  },
  {
    name_fr: 'Tractions supination',
    name_en: 'Chin-ups',
    muscle_group: 'back',
    secondary_muscles: ['biceps'],
    equipment: ['pull_up_bar'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Rowing barre',
    name_en: 'Barbell Row',
    muscle_group: 'back',
    secondary_muscles: ['biceps', 'rear_delts'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Rowing haltère',
    name_en: 'Dumbbell Row',
    muscle_group: 'back',
    secondary_muscles: ['biceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Tirage vertical poulie haute',
    name_en: 'Lat Pulldown',
    muscle_group: 'back',
    secondary_muscles: ['biceps'],
    equipment: ['cable', 'machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Tirage horizontal poulie basse',
    name_en: 'Seated Cable Row',
    muscle_group: 'back',
    secondary_muscles: ['biceps', 'rear_delts'],
    equipment: ['cable', 'machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Soulevé de terre',
    name_en: 'Deadlift',
    muscle_group: 'back',
    secondary_muscles: ['hamstrings', 'glutes', 'traps', 'forearms'],
    equipment: ['barbell'],
    difficulty: 'advanced',
    morphotype_recommendations: JSON.stringify({
      ectomorph: 'good',
      mesomorph: 'excellent',
      endomorph: 'excellent',
    }),
  },
  {
    name_fr: 'Rowing T-bar',
    name_en: 'T-Bar Row',
    muscle_group: 'back',
    secondary_muscles: ['biceps', 'rear_delts'],
    equipment: ['t_bar', 'barbell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Pullover haltère',
    name_en: 'Dumbbell Pullover',
    muscle_group: 'back',
    secondary_muscles: ['chest', 'triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Shrugs haltères',
    name_en: 'Dumbbell Shrugs',
    muscle_group: 'back',
    secondary_muscles: ['traps'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },

  // SHOULDERS
  {
    name_fr: 'Développé militaire',
    name_en: 'Overhead Press',
    muscle_group: 'shoulders',
    secondary_muscles: ['triceps', 'traps'],
    equipment: ['barbell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Développé haltères assis',
    name_en: 'Seated Dumbbell Press',
    muscle_group: 'shoulders',
    secondary_muscles: ['triceps'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Élévations latérales',
    name_en: 'Lateral Raises',
    muscle_group: 'shoulders',
    secondary_muscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Élévations frontales',
    name_en: 'Front Raises',
    muscle_group: 'shoulders',
    secondary_muscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Oiseau (rear delt fly)',
    name_en: 'Rear Delt Fly',
    muscle_group: 'shoulders',
    secondary_muscles: ['back'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Face pull',
    name_en: 'Face Pull',
    muscle_group: 'shoulders',
    secondary_muscles: ['back', 'traps'],
    equipment: ['cable'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Arnold press',
    name_en: 'Arnold Press',
    muscle_group: 'shoulders',
    secondary_muscles: ['triceps'],
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Rowing menton',
    name_en: 'Upright Row',
    muscle_group: 'shoulders',
    secondary_muscles: ['traps', 'biceps'],
    equipment: ['barbell', 'dumbbell'],
    difficulty: 'intermediate',
  },

  // LEGS
  {
    name_fr: 'Squat barre',
    name_en: 'Barbell Squat',
    muscle_group: 'legs',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['barbell', 'squat_rack'],
    difficulty: 'intermediate',
    morphotype_recommendations: JSON.stringify({
      ectomorph: 'challenging',
      mesomorph: 'excellent',
      endomorph: 'good',
    }),
  },
  {
    name_fr: 'Squat avant (front squat)',
    name_en: 'Front Squat',
    muscle_group: 'legs',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['barbell', 'squat_rack'],
    difficulty: 'advanced',
  },
  {
    name_fr: 'Presse à cuisses',
    name_en: 'Leg Press',
    muscle_group: 'legs',
    secondary_muscles: ['glutes'],
    equipment: ['machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Hack squat',
    name_en: 'Hack Squat',
    muscle_group: 'legs',
    secondary_muscles: ['glutes'],
    equipment: ['machine'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Fentes avant',
    name_en: 'Forward Lunges',
    muscle_group: 'legs',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Fentes marchées',
    name_en: 'Walking Lunges',
    muscle_group: 'legs',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'bodyweight'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Leg extension',
    name_en: 'Leg Extension',
    muscle_group: 'legs',
    secondary_muscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Leg curl couché',
    name_en: 'Lying Leg Curl',
    muscle_group: 'legs',
    secondary_muscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Leg curl assis',
    name_en: 'Seated Leg Curl',
    muscle_group: 'legs',
    secondary_muscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Soulevé de terre jambes tendues',
    name_en: 'Romanian Deadlift',
    muscle_group: 'legs',
    secondary_muscles: ['back', 'glutes'],
    equipment: ['barbell', 'dumbbell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Hip thrust',
    name_en: 'Hip Thrust',
    muscle_group: 'legs',
    secondary_muscles: ['glutes'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Mollets debout',
    name_en: 'Standing Calf Raise',
    muscle_group: 'legs',
    secondary_muscles: [],
    equipment: ['machine', 'dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Mollets assis',
    name_en: 'Seated Calf Raise',
    muscle_group: 'legs',
    secondary_muscles: [],
    equipment: ['machine'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Squat bulgare',
    name_en: 'Bulgarian Split Squat',
    muscle_group: 'legs',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Goblet squat',
    name_en: 'Goblet Squat',
    muscle_group: 'legs',
    secondary_muscles: ['glutes', 'core'],
    equipment: ['dumbbell', 'kettlebell'],
    difficulty: 'beginner',
  },

  // ARMS - BICEPS
  {
    name_fr: 'Curl barre',
    name_en: 'Barbell Curl',
    muscle_group: 'arms',
    secondary_muscles: ['forearms'],
    equipment: ['barbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Curl haltères',
    name_en: 'Dumbbell Curl',
    muscle_group: 'arms',
    secondary_muscles: ['forearms'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Curl marteau',
    name_en: 'Hammer Curl',
    muscle_group: 'arms',
    secondary_muscles: ['forearms'],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Curl incliné',
    name_en: 'Incline Curl',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['dumbbell', 'incline_bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Curl concentré',
    name_en: 'Concentration Curl',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Curl pupitre (Larry Scott)',
    name_en: 'Preacher Curl',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['barbell', 'ez_bar', 'preacher_bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Curl poulie basse',
    name_en: 'Cable Curl',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['cable'],
    difficulty: 'beginner',
  },

  // ARMS - TRICEPS
  {
    name_fr: 'Dips triceps',
    name_en: 'Tricep Dips',
    muscle_group: 'arms',
    secondary_muscles: ['chest', 'shoulders'],
    equipment: ['dip_bars'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Extension triceps poulie haute',
    name_en: 'Tricep Pushdown',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['cable'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Extension triceps corde',
    name_en: 'Rope Pushdown',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['cable'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Barre au front',
    name_en: 'Skull Crusher',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['ez_bar', 'barbell', 'bench'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Extension triceps haltère',
    name_en: 'Overhead Tricep Extension',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Kickback triceps',
    name_en: 'Tricep Kickback',
    muscle_group: 'arms',
    secondary_muscles: [],
    equipment: ['dumbbell'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Développé couché prise serrée',
    name_en: 'Close Grip Bench Press',
    muscle_group: 'arms',
    secondary_muscles: ['chest'],
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
  },

  // CORE
  {
    name_fr: 'Crunch',
    name_en: 'Crunch',
    muscle_group: 'core',
    secondary_muscles: [],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Crunch inversé',
    name_en: 'Reverse Crunch',
    muscle_group: 'core',
    secondary_muscles: [],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Planche',
    name_en: 'Plank',
    muscle_group: 'core',
    secondary_muscles: ['shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Planche latérale',
    name_en: 'Side Plank',
    muscle_group: 'core',
    secondary_muscles: ['obliques'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Relevé de jambes suspendu',
    name_en: 'Hanging Leg Raise',
    muscle_group: 'core',
    secondary_muscles: ['hip_flexors'],
    equipment: ['pull_up_bar'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Ab wheel rollout',
    name_en: 'Ab Wheel Rollout',
    muscle_group: 'core',
    secondary_muscles: ['shoulders'],
    equipment: ['ab_wheel'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Mountain climbers',
    name_en: 'Mountain Climbers',
    muscle_group: 'core',
    secondary_muscles: ['hip_flexors', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Russian twist',
    name_en: 'Russian Twist',
    muscle_group: 'core',
    secondary_muscles: ['obliques'],
    equipment: ['bodyweight', 'medicine_ball'],
    difficulty: 'beginner',
  },
  {
    name_fr: 'Crunch câble',
    name_en: 'Cable Crunch',
    muscle_group: 'core',
    secondary_muscles: [],
    equipment: ['cable'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Dead bug',
    name_en: 'Dead Bug',
    muscle_group: 'core',
    secondary_muscles: [],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
  },

  // CARDIO / FULL BODY
  {
    name_fr: 'Burpees',
    name_en: 'Burpees',
    muscle_group: 'full_body',
    secondary_muscles: ['chest', 'legs', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Kettlebell swing',
    name_en: 'Kettlebell Swing',
    muscle_group: 'full_body',
    secondary_muscles: ['glutes', 'hamstrings', 'core', 'shoulders'],
    equipment: ['kettlebell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Clean & Press',
    name_en: 'Clean and Press',
    muscle_group: 'full_body',
    secondary_muscles: ['shoulders', 'legs', 'back'],
    equipment: ['barbell', 'dumbbell'],
    difficulty: 'advanced',
  },
  {
    name_fr: 'Thrusters',
    name_en: 'Thrusters',
    muscle_group: 'full_body',
    secondary_muscles: ['legs', 'shoulders', 'core'],
    equipment: ['barbell', 'dumbbell'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Box jumps',
    name_en: 'Box Jumps',
    muscle_group: 'full_body',
    secondary_muscles: ['legs'],
    equipment: ['plyo_box'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Battle ropes',
    name_en: 'Battle Ropes',
    muscle_group: 'full_body',
    secondary_muscles: ['shoulders', 'core', 'arms'],
    equipment: ['battle_ropes'],
    difficulty: 'intermediate',
  },
  {
    name_fr: 'Rowing machine',
    name_en: 'Rowing Machine',
    muscle_group: 'full_body',
    secondary_muscles: ['back', 'legs', 'arms'],
    equipment: ['rowing_machine'],
    difficulty: 'beginner',
  },
];

// =====================================================
// FOOD CRAVINGS ("J'ai envie de...")
// =====================================================

const foodCravings = [
  { name_fr: 'Pizza', icon: '🍕', estimated_calories: 800, category: 'fast_food' },
  { name_fr: 'Burger', icon: '🍔', estimated_calories: 700, category: 'fast_food' },
  { name_fr: 'Tacos', icon: '🌮', estimated_calories: 600, category: 'fast_food' },
  { name_fr: 'Kebab', icon: '🥙', estimated_calories: 800, category: 'fast_food' },
  { name_fr: 'Sushi', icon: '🍣', estimated_calories: 500, category: 'restaurant' },
  { name_fr: 'Pâtes', icon: '🍝', estimated_calories: 600, category: 'restaurant' },
  { name_fr: 'Frites', icon: '🍟', estimated_calories: 400, category: 'fast_food' },
  { name_fr: 'Glace', icon: '🍦', estimated_calories: 300, category: 'dessert' },
  { name_fr: 'Chocolat', icon: '🍫', estimated_calories: 250, category: 'snack' },
  { name_fr: 'Gâteau', icon: '🍰', estimated_calories: 400, category: 'dessert' },
  { name_fr: 'Croissant', icon: '🥐', estimated_calories: 300, category: 'breakfast' },
  { name_fr: 'Bière', icon: '🍺', estimated_calories: 200, category: 'drink' },
  { name_fr: 'Vin', icon: '🍷', estimated_calories: 150, category: 'drink' },
  { name_fr: 'Cocktail', icon: '🍹', estimated_calories: 250, category: 'drink' },
  { name_fr: 'Soda', icon: '🥤', estimated_calories: 150, category: 'drink' },
  { name_fr: 'Chips', icon: '🥔', estimated_calories: 300, category: 'snack' },
  { name_fr: 'Bonbons', icon: '🍬', estimated_calories: 200, category: 'snack' },
  { name_fr: 'McDo', icon: '🍟', estimated_calories: 900, category: 'fast_food' },
  { name_fr: 'KFC', icon: '🍗', estimated_calories: 800, category: 'fast_food' },
  { name_fr: 'Soirée arrosée', icon: '🎉', estimated_calories: 1500, category: 'event' },
  { name_fr: 'Resto entre amis', icon: '🍽️', estimated_calories: 1200, category: 'event' },
  { name_fr: 'Apéro', icon: '🥂', estimated_calories: 600, category: 'event' },
  { name_fr: 'Brunch', icon: '🥞', estimated_calories: 1000, category: 'event' },
  { name_fr: 'Crêpes', icon: '🥞', estimated_calories: 400, category: 'dessert' },
  { name_fr: 'Nutella', icon: '🫙', estimated_calories: 200, category: 'snack' },
];

// =====================================================
// ACHIEVEMENTS
// =====================================================

const achievements = [
  // Training achievements
  {
    key: 'first_workout',
    name_fr: 'Premier pas',
    description_fr: 'Complète ton premier entraînement',
    icon: '🎯',
    xp_reward: 50,
    category: 'training',
    requirement: JSON.stringify({ type: 'workout_count', value: 1 }),
  },
  {
    key: 'workout_10',
    name_fr: 'Régulier',
    description_fr: 'Complète 10 entraînements',
    icon: '💪',
    xp_reward: 100,
    category: 'training',
    requirement: JSON.stringify({ type: 'workout_count', value: 10 }),
  },
  {
    key: 'workout_50',
    name_fr: 'Assidu',
    description_fr: 'Complète 50 entraînements',
    icon: '🏋️',
    xp_reward: 250,
    category: 'training',
    requirement: JSON.stringify({ type: 'workout_count', value: 50 }),
  },
  {
    key: 'workout_100',
    name_fr: 'Centurion',
    description_fr: 'Complète 100 entraînements',
    icon: '⚔️',
    xp_reward: 500,
    category: 'training',
    requirement: JSON.stringify({ type: 'workout_count', value: 100 }),
  },
  {
    key: 'first_pr',
    name_fr: 'Record battu',
    description_fr: 'Bats ton premier record personnel',
    icon: '🏆',
    xp_reward: 100,
    category: 'training',
    requirement: JSON.stringify({ type: 'pr_count', value: 1 }),
  },
  {
    key: 'pr_10',
    name_fr: 'Chasseur de PR',
    description_fr: 'Bats 10 records personnels',
    icon: '🎖️',
    xp_reward: 300,
    category: 'training',
    requirement: JSON.stringify({ type: 'pr_count', value: 10 }),
  },
  {
    key: 'boss_slayer',
    name_fr: 'Tueur de Boss',
    description_fr: 'Gagne ton premier Boss Fight',
    icon: '🐉',
    xp_reward: 200,
    category: 'training',
    requirement: JSON.stringify({ type: 'boss_fight_won', value: 1 }),
  },

  // Consistency achievements
  {
    key: 'streak_7',
    name_fr: 'Semaine parfaite',
    description_fr: "Maintiens un streak de 7 jours d'affilée",
    icon: '🔥',
    xp_reward: 150,
    category: 'consistency',
    requirement: JSON.stringify({ type: 'streak', value: 7 }),
  },
  {
    key: 'streak_30',
    name_fr: 'Mois de feu',
    description_fr: 'Maintiens un streak de 30 jours',
    icon: '🌟',
    xp_reward: 500,
    category: 'consistency',
    requirement: JSON.stringify({ type: 'streak', value: 30 }),
  },
  {
    key: 'comeback',
    name_fr: 'Le Retour',
    description_fr: "Reviens après un écart sans abandonner l'app",
    icon: '🦅',
    xp_reward: 100,
    category: 'consistency',
    requirement: JSON.stringify({ type: 'comeback', value: 1 }),
    is_secret: true,
  },

  // Nutrition achievements
  {
    key: 'first_log',
    name_fr: 'Premier log',
    description_fr: 'Enregistre ton premier repas',
    icon: '🍎',
    xp_reward: 25,
    category: 'nutrition',
    requirement: JSON.stringify({ type: 'food_entry_count', value: 1 }),
  },
  {
    key: 'honest_cheat',
    name_fr: 'Honnête avec soi',
    description_fr: 'Log un écart sans culpabilité',
    icon: '🎭',
    xp_reward: 50,
    category: 'nutrition',
    requirement: JSON.stringify({ type: 'cheat_logged', value: 1 }),
  },
  {
    key: 'week_logged',
    name_fr: 'Semaine complète',
    description_fr: 'Log tous tes repas pendant 7 jours',
    icon: '📝',
    xp_reward: 200,
    category: 'nutrition',
    requirement: JSON.stringify({ type: 'days_logged', value: 7 }),
  },

  // Measurement achievements
  {
    key: 'first_measure',
    name_fr: 'Prise de mesures',
    description_fr: 'Enregistre tes premières mensurations',
    icon: '📏',
    xp_reward: 50,
    category: 'measurements',
    requirement: JSON.stringify({ type: 'measurement_count', value: 1 }),
  },
  {
    key: 'first_photo',
    name_fr: 'Instantané',
    description_fr: 'Prends ta première photo de progression',
    icon: '📸',
    xp_reward: 50,
    category: 'measurements',
    requirement: JSON.stringify({ type: 'photo_count', value: 1 }),
  },
  {
    key: 'morpho_complete',
    name_fr: 'Connais-toi toi-même',
    description_fr: "Complète l'analyse morphologique",
    icon: '🧬',
    xp_reward: 100,
    category: 'measurements',
    requirement: JSON.stringify({ type: 'morpho_complete', value: 1 }),
  },
];

async function seed() {
  console.log('Starting seed...');

  // Insert morpho questions
  console.log('Inserting morpho questions...');
  for (const q of morphoQuestions) {
    try {
      await sql`
        INSERT INTO morpho_questions (question_key, question_text_fr, question_type, options, order_index)
        VALUES (${q.question_key}, ${q.question_text_fr}, ${q.question_type}, ${q.options}, ${q.order_index})
        ON CONFLICT (question_key) DO NOTHING
      `;
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`Error inserting question ${q.question_key}:`, error.message);
    }
  }
  console.log(`Inserted ${morphoQuestions.length} morpho questions`);

  // Insert exercises
  console.log('Inserting exercises...');
  for (const ex of exercises) {
    try {
      await sql`
        INSERT INTO exercises (name_fr, name_en, muscle_group, secondary_muscles, equipment, difficulty, instructions, morphotype_recommendations)
        VALUES (
          ${ex.name_fr},
          ${ex.name_en || null},
          ${ex.muscle_group},
          ${ex.secondary_muscles || []},
          ${ex.equipment || []},
          ${ex.difficulty || 'intermediate'},
          ${ex.instructions || []},
          ${ex.morphotype_recommendations || null}
        )
        ON CONFLICT DO NOTHING
      `;
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`Error inserting exercise ${ex.name_fr}:`, error.message);
    }
  }
  console.log(`Inserted ${exercises.length} exercises`);

  // Insert food cravings
  console.log('Inserting food cravings...');
  for (const craving of foodCravings) {
    try {
      await sql`
        INSERT INTO food_cravings (name_fr, icon, estimated_calories, category)
        VALUES (${craving.name_fr}, ${craving.icon}, ${craving.estimated_calories}, ${craving.category})
        ON CONFLICT DO NOTHING
      `;
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`Error inserting craving ${craving.name_fr}:`, error.message);
    }
  }
  console.log(`Inserted ${foodCravings.length} food cravings`);

  // Insert achievements
  console.log('Inserting achievements...');
  for (const ach of achievements) {
    try {
      await sql`
        INSERT INTO achievements (key, name_fr, description_fr, icon, xp_reward, category, requirement, is_secret)
        VALUES (
          ${ach.key},
          ${ach.name_fr},
          ${ach.description_fr},
          ${ach.icon},
          ${ach.xp_reward},
          ${ach.category},
          ${ach.requirement},
          ${ach.is_secret || false}
        )
        ON CONFLICT (key) DO NOTHING
      `;
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`Error inserting achievement ${ach.key}:`, error.message);
    }
  }
  console.log(`Inserted ${achievements.length} achievements`);

  console.log('\nSeed complete!');
  await sql.end();
}

seed().catch(console.error);
