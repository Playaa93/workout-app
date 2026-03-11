import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_EBZRvdhi6l2g@ep-cold-cherry-abb86rz2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

const sql = postgres(DATABASE_URL, { ssl: 'require' });

// Type definitions for the enriched exercise data
interface EnrichedExercise {
  id: string;
  name_fr: string;
  name_en: string;
  aliases: string[];
  movement_pattern: string;
  exercise_type: string;
  muscle_group: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  stabilizers: string[];
  equipment: string[];
  equipment_alternatives?: string[];
  good_for: {
    morphotypes: string[];
    conditions: string[];
  };
  bad_for: {
    morphotypes: string[];
    conditions: string[];
  };
  modifications: Array<{
    condition: string;
    adjustment: string;
  }>;
  difficulty: string;
  technique_cues: string[];
  common_mistakes: string[];
  source: string;
  video_url?: string;
  goal_scores?: { strength: number; hypertrophy: number; athletic: number; rehab: number };
  programming_priority?: string;
  morpho_protocols?: Record<string, unknown>;
  rest_modifiers?: Record<string, number>;
  tempo_recommendations?: Record<string, string>;
}

interface ExerciseData {
  version: string;
  source: string;
  exercises: EnrichedExercise[];
}

const SEP = '\0';

function exerciseKey(nameFr: string, muscleGroup: string): string {
  return `${nameFr}${SEP}${muscleGroup}`;
}

function exerciseValues(ex: EnrichedExercise) {
  return {
    name_en: ex.name_en || null,
    aliases: ex.aliases || [],
    movement_pattern: ex.movement_pattern,
    exercise_type: ex.exercise_type,
    muscle_group: ex.muscle_group,
    primary_muscles: ex.primary_muscles || [],
    secondary_muscles: ex.secondary_muscles || [],
    stabilizers: ex.stabilizers || [],
    equipment: ex.equipment || [],
    equipment_alternatives: ex.equipment_alternatives || [],
    good_for: JSON.stringify(ex.good_for || { morphotypes: [], conditions: [] }),
    bad_for: JSON.stringify(ex.bad_for || { morphotypes: [], conditions: [] }),
    modifications: JSON.stringify(ex.modifications || []),
    difficulty: ex.difficulty || 'intermediate',
    technique_cues: ex.technique_cues || [],
    common_mistakes: ex.common_mistakes || [],
    source: ex.source || 'manual',
    video_url: ex.video_url || null,
    goal_scores: JSON.stringify(ex.goal_scores || null),
    programming_priority: ex.programming_priority || null,
    morpho_protocols: JSON.stringify(ex.morpho_protocols || null),
    rest_modifiers: JSON.stringify(ex.rest_modifiers || null),
    tempo_recommendations: JSON.stringify(ex.tempo_recommendations || null),
  };
}

async function seedEnrichedExercises() {
  console.log('Starting enriched exercises seed...');

  // Read the enriched exercises JSON file
  const dataPath = path.join(__dirname, '../../data/exercises-merged.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: ExerciseData = JSON.parse(rawData);

  console.log(`Found ${data.exercises.length} exercises to import`);
  console.log(`Data version: ${data.version}`);
  console.log(`Source: ${data.source}`);

  // Build a lookup of existing non-custom exercises by (name_fr, muscle_group) to preserve UUIDs
  const existing = await sql`
    SELECT id, name_fr, muscle_group FROM exercises WHERE is_custom = false OR is_custom IS NULL
  `;
  const existingByKey = new Map<string, string>();
  for (const row of existing) {
    existingByKey.set(exerciseKey(row.name_fr, row.muscle_group), row.id);
  }
  console.log(`Found ${existingByKey.size} existing non-custom exercises in DB`);

  // Track which existing exercises are still in the seed data
  const seenKeys = new Set<string>();

  let insertCount = 0;
  let updateCount = 0;
  let errorCount = 0;

  // Use a single persistent connection (transaction) to batch all queries
  // instead of ~968 individual HTTP round-trips to Neon
  await sql.begin(async (tsql) => {
    for (const ex of data.exercises) {
      const key = exerciseKey(ex.name_fr, ex.muscle_group);
      seenKeys.add(key);
      const existingId = existingByKey.get(key);
      const v = exerciseValues(ex);

      try {
        if (existingId) {
          await (tsql as any)`
            UPDATE exercises SET
              name_en = ${v.name_en}, aliases = ${v.aliases},
              movement_pattern = ${v.movement_pattern}, exercise_type = ${v.exercise_type},
              muscle_group = ${v.muscle_group}, primary_muscles = ${v.primary_muscles},
              secondary_muscles = ${v.secondary_muscles}, stabilizers = ${v.stabilizers},
              equipment = ${v.equipment}, equipment_alternatives = ${v.equipment_alternatives},
              good_for = ${v.good_for}, bad_for = ${v.bad_for},
              modifications = ${v.modifications}, difficulty = ${v.difficulty},
              technique_cues = ${v.technique_cues}, common_mistakes = ${v.common_mistakes},
              source = ${v.source}, video_url = ${v.video_url},
              goal_scores = ${v.goal_scores}, programming_priority = ${v.programming_priority},
              morpho_protocols = ${v.morpho_protocols}, rest_modifiers = ${v.rest_modifiers},
              tempo_recommendations = ${v.tempo_recommendations}
            WHERE id = ${existingId}
          `;
          updateCount++;
        } else {
          await (tsql as any)`
            INSERT INTO exercises (
              name_fr, name_en, aliases, movement_pattern, exercise_type,
              muscle_group, primary_muscles, secondary_muscles, stabilizers,
              equipment, equipment_alternatives, good_for, bad_for, modifications,
              difficulty, technique_cues, common_mistakes, source, video_url,
              is_custom, goal_scores, programming_priority, morpho_protocols,
              rest_modifiers, tempo_recommendations
            )
            VALUES (
              ${ex.name_fr}, ${v.name_en}, ${v.aliases},
              ${v.movement_pattern}, ${v.exercise_type}, ${v.muscle_group},
              ${v.primary_muscles}, ${v.secondary_muscles},
              ${v.stabilizers}, ${v.equipment}, ${v.equipment_alternatives},
              ${v.good_for}, ${v.bad_for}, ${v.modifications},
              ${v.difficulty}, ${v.technique_cues}, ${v.common_mistakes},
              ${v.source}, ${v.video_url}, false,
              ${v.goal_scores}, ${v.programming_priority},
              ${v.morpho_protocols}, ${v.rest_modifiers}, ${v.tempo_recommendations}
            )
          `;
          insertCount++;
        }
      } catch (e: unknown) {
        const error = e as Error;
        console.error(`Error processing exercise ${ex.name_fr}:`, error.message);
        errorCount++;
      }
    }
  });

  // Remove exercises no longer in the seed data (only non-custom, and only if not referenced)
  const removedKeys = [...existingByKey.keys()].filter(k => !seenKeys.has(k));
  let removeCount = 0;
  for (const key of removedKeys) {
    const eid = existingByKey.get(key)!;
    const name = key.split(SEP)[0];
    // Only delete if no user data references this exercise
    const refs = await sql`
      SELECT COUNT(*) as cnt FROM (
        SELECT id FROM workout_sets WHERE exercise_id = ${eid}
        UNION ALL SELECT id FROM personal_records WHERE exercise_id = ${eid}
        UNION ALL SELECT id FROM workout_template_exercises WHERE exercise_id = ${eid}
        UNION ALL SELECT id FROM user_exercise_notes WHERE exercise_id = ${eid}
        UNION ALL SELECT id FROM user_machine_setups WHERE exercise_id = ${eid}
        UNION ALL SELECT id FROM boss_fights WHERE exercise_id = ${eid}
      ) refs
    `;
    if (Number(refs[0].cnt) === 0) {
      await sql`DELETE FROM exercises WHERE id = ${eid}`;
      removeCount++;
    } else {
      console.log(`Keeping removed exercise "${name}" (${eid}) — still referenced by user data`);
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`Updated: ${updateCount} exercises`);
  console.log(`Inserted: ${insertCount} exercises`);
  console.log(`Removed: ${removeCount} orphan exercises`);
  console.log(`Kept: ${removedKeys.length - removeCount} removed exercises (still referenced)`);
  console.log(`Errors: ${errorCount}`);

  await sql.end();
}

// Run the seed
seedEnrichedExercises().catch(console.error);
