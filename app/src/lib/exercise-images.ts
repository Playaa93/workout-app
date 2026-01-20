/**
 * Exercise Image Mapping
 * Maps exercise English names to free-exercise-db IDs for image URLs
 * Source: https://github.com/yuhonas/free-exercise-db
 */

// Complete mapping from our 124 exercises to free-exercise-db IDs
const EXERCISE_IMAGE_MAPPING: Record<string, string> = {
  // ============== CHEST ==============
  'Barbell Bench Press': 'Barbell_Bench_Press_-_Medium_Grip',
  'Dumbbell Bench Press': 'Dumbbell_Bench_Press',
  'Incline Barbell Press': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'Incline Dumbbell Press': 'Incline_Dumbbell_Press',
  'Decline Press': 'Decline_Barbell_Bench_Press',
  'Floor Press': 'Dumbbell_Floor_Press',
  'Cable Crossover': 'Cable_Crossover',
  'Dumbbell Fly': 'Dumbbell_Flyes',
  'High Cable Fly': 'Cable_Crossover',
  'Low Cable Fly': 'Low_Cable_Crossover',
  'Pec Deck Machine': 'Butterfly',
  'Machine Chest Press': 'Machine_Bench_Press',
  'Convergent Bench Press': 'Leverage_Chest_Press',
  'Convergent Incline Press': 'Leverage_Incline_Chest_Press',
  'Convergent Decline Press': 'Leverage_Decline_Chest_Press',
  'Push-ups': 'Pushups',
  'Chest Dips': 'Dips_-_Chest_Version',
  'Dumbbell Pullover': 'Bent-Arm_Dumbbell_Pullover',
  'Low Cable Pullover': 'Straight-Arm_Pulldown',

  // ============== BACK ==============
  'Barbell Row': 'Bent_Over_Barbell_Row',
  'Dumbbell Row': 'One-Arm_Dumbbell_Row',
  'Pendlay Row': 'Bent_Over_Barbell_Row', // No Pendlay specific, use bent over row
  'T-Bar Row': 'T-Bar_Row_with_Handle',
  'Meadows Row': 'One-Arm_Dumbbell_Row', // Similar movement
  'Chest Supported Row': 'Dumbbell_Incline_Row',
  'Seated Cable Row': 'Seated_Cable_Rows',
  'Low Row Machine': 'Seated_Cable_Rows',
  'Convergent Row': 'Leverage_High_Row',
  'Lat Pulldown': 'Wide-Grip_Lat_Pulldown',
  'Convergent Lat Pulldown': 'Close-Grip_Front_Lat_Pulldown',
  'Reverse Grip Pulldown': 'Underhand_Cable_Pulldowns',
  'Pull-ups': 'Pullups',
  'Chin-ups': 'Chin-Up',
  'Assisted Pull-up Machine': 'Band_Assisted_Pull-Up',
  'Deadlift': 'Barbell_Deadlift',
  'Romanian Deadlift': 'Romanian_Deadlift',
  'Sumo Deadlift': 'Sumo_Deadlift',
  'Trap Bar Deadlift': 'Trap_Bar_Deadlift',
  'Single Leg Romanian Deadlift': 'Kettlebell_One-Legged_Deadlift',
  'Good Morning': 'Good_Morning',
  'Cable Pullover': 'Straight-Arm_Pulldown',
  'Face Pull': 'Face_Pull',

  // ============== SHOULDERS ==============
  'Overhead Press': 'Standing_Military_Press',
  'Seated Dumbbell Press': 'Seated_Dumbbell_Press',
  'Arnold Press': 'Arnold_Dumbbell_Press',
  'Landmine Press': 'Landmine_180s', // Closest landmine exercise
  'Convergent Shoulder Press': 'Leverage_Shoulder_Press',
  'Lateral Raises': 'Side_Lateral_Raise',
  'Cable Lateral Raise': 'Cable_Seated_Lateral_Raise',
  'Machine Lateral Raise': 'Seated_Side_Lateral_Raise',
  'Front Raises': 'Front_Dumbbell_Raise',
  'Cable Front Raise': 'Front_Cable_Raise',
  'Rear Delt Fly': 'Seated_Bent-Over_Rear_Delt_Raise',
  'Cable Rear Delt Fly': 'Cable_Rear_Delt_Fly',
  'Reverse Fly Machine': 'Reverse_Machine_Flyes',
  'Cable L-Fly': 'External_Rotation',
  'Upright Row': 'Upright_Barbell_Row',
  'Dumbbell Shrugs': 'Dumbbell_Shrug',
  'Clean and Press': 'Clean_and_Press',

  // ============== BICEPS ==============
  'Barbell Curl': 'Barbell_Curl',
  'Dumbbell Curl': 'Dumbbell_Bicep_Curl',
  'Incline Curl': 'Incline_Dumbbell_Curl',
  'Hammer Curl': 'Hammer_Curls',
  'Cable Hammer Curl': 'Cable_Hammer_Curls_-_Rope_Attachment',
  'Preacher Curl': 'Preacher_Curl',
  'Preacher Curl Machine': 'Machine_Preacher_Curls',
  'Cable Curl': 'High_Cable_Curls',
  'Cable Curl Face to Face': 'High_Cable_Curls',
  'Face Away Cable Curl': 'Overhead_Cable_Curl',
  'Concentration Curl': 'Concentration_Curls',
  'Reverse Curl': 'Reverse_Barbell_Curl',

  // ============== TRICEPS ==============
  'Tricep Pushdown': 'Triceps_Pushdown',
  'Rope Pushdown': 'Triceps_Pushdown_-_Rope_Attachment',
  'Overhead Tricep Extension': 'Standing_Overhead_Barbell_Triceps_Extension',
  'Cable Overhead Triceps Extension': 'Cable_Rope_Overhead_Triceps_Extension',
  'Skull Crusher': 'Lying_Triceps_Press',
  'Close Grip Bench Press': 'Close-Grip_Barbell_Bench_Press',
  'Tricep Kickback': 'Tricep_Dumbbell_Kickback',
  'Cable Triceps Kickback': 'Cable_One_Arm_Tricep_Extension',
  'Tricep Dips': 'Dips_-_Triceps_Version',
  'Triceps Dip Machine': 'Machine_Triceps_Extension',
  'Assisted Dip Machine': 'Dip_Machine',

  // ============== LEGS - QUADS ==============
  'Barbell Squat': 'Barbell_Full_Squat',
  'Front Squat': 'Front_Barbell_Squat',
  'Goblet Squat': 'Goblet_Squat',
  'Hack Squat': 'Hack_Squat',
  'Smith Machine Squat': 'Smith_Machine_Squat',
  'Pendulum Squat': 'Hack_Squat', // Similar machine
  'Belt Squat Machine': 'Hack_Squat', // Similar movement
  'Sissy Squat': 'Weighted_Sissy_Squat',
  'Leg Press': 'Leg_Press',
  'Vertical Leg Press': 'Smith_Machine_Leg_Press',
  'Leg Extension': 'Leg_Extensions',
  'Bulgarian Split Squat': 'Split_Squats',
  'Walking Lunges': 'Barbell_Walking_Lunge',
  'Forward Lunges': 'Dumbbell_Lunges',

  // ============== LEGS - HAMSTRINGS & GLUTES ==============
  'Lying Leg Curl': 'Lying_Leg_Curls',
  'Seated Leg Curl': 'Seated_Leg_Curl',
  'Hip Thrust': 'Barbell_Hip_Thrust',
  'Glute Bridge': 'Barbell_Glute_Bridge',
  'Cable Glute Kickback': 'Glute_Kickback',
  'Kettlebell Swing': 'One-Arm_Kettlebell_Swings',

  // ============== LEGS - ADDUCTORS/ABDUCTORS ==============
  'Adductor Machine': 'Thigh_Adductor',
  'Abductor Machine': 'Thigh_Abductor',
  'Seated Hip Adductor Machine': 'Thigh_Adductor',
  'Seated Hip Abductor Machine': 'Thigh_Abductor',
  'Cable Hip Adduction': 'Cable_Hip_Adduction',
  'Cable Hip Abduction': 'Thigh_Abductor', // Similar movement

  // ============== CALVES ==============
  'Standing Calf Raise': 'Standing_Calf_Raises',
  'Standing Calf Machine': 'Smith_Machine_Calf_Raise',
  'Seated Calf Raise': 'Seated_Calf_Raise',

  // ============== CORE ==============
  'Crunch': 'Crunches',
  'Reverse Crunch': 'Reverse_Crunch',
  'Cable Crunch': 'Cable_Crunch',
  'Hanging Leg Raise': 'Hanging_Leg_Raise',
  'Plank': 'Plank',
  'Side Plank': 'Plank', // No side plank, use regular plank
  'Ab Wheel Rollout': 'Ab_Roller',
  'Russian Twist': 'Russian_Twist',
  'Cable Woodchop': 'Standing_Cable_Wood_Chop',
  'Cable Pallof Press': 'Pallof_Press_With_Rotation',
  'Dead Bug': 'Dead_Bug',
  'Mountain Climbers': 'Mountain_Climbers',
  'Burpees': 'Box_Jump_Multiple_Response', // Closest full-body explosive
};

// Base URL for free-exercise-db images
const FREE_EXERCISE_DB_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

/**
 * Get image URLs for an exercise
 * @param exerciseNameEn English name of the exercise
 * @returns Array of image URLs (typically 2 images per exercise)
 */
export function getExerciseImages(exerciseNameEn: string | null): string[] {
  if (!exerciseNameEn) return [];

  const exerciseId = EXERCISE_IMAGE_MAPPING[exerciseNameEn];
  if (!exerciseId) return [];

  // free-exercise-db typically has 2 images per exercise: 0.jpg and 1.jpg
  return [
    `${FREE_EXERCISE_DB_BASE_URL}/${exerciseId}/0.jpg`,
    `${FREE_EXERCISE_DB_BASE_URL}/${exerciseId}/1.jpg`,
  ];
}

/**
 * Get the primary image URL for an exercise
 * @param exerciseNameEn English name of the exercise
 * @returns Primary image URL or null
 */
export function getExerciseImage(exerciseNameEn: string | null): string | null {
  const images = getExerciseImages(exerciseNameEn);
  return images.length > 0 ? images[0] : null;
}

/**
 * Check if we have images for an exercise
 */
export function hasExerciseImages(exerciseNameEn: string | null): boolean {
  if (!exerciseNameEn) return false;
  return exerciseNameEn in EXERCISE_IMAGE_MAPPING;
}

/**
 * Get coverage stats
 */
export function getImageCoverageStats() {
  return {
    mappedCount: Object.keys(EXERCISE_IMAGE_MAPPING).length,
    mapping: EXERCISE_IMAGE_MAPPING,
  };
}

// Export the mapping for debugging/extension
export { EXERCISE_IMAGE_MAPPING };
