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

async function seedEnrichedExercises() {
  console.log('Starting enriched exercises seed...');

  // Read the enriched exercises JSON file
  const dataPath = path.join(__dirname, '../../data/exercises-enriched.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: ExerciseData = JSON.parse(rawData);

  console.log(`Found ${data.exercises.length} exercises to import`);
  console.log(`Data version: ${data.version}`);
  console.log(`Source: ${data.source}`);

  // First, delete existing non-custom exercises to avoid duplicates
  console.log('Clearing existing non-custom exercises...');
  await sql`DELETE FROM exercises WHERE is_custom = false OR is_custom IS NULL`;

  // Insert each exercise
  let successCount = 0;
  let errorCount = 0;

  for (const ex of data.exercises) {
    try {
      await sql`
        INSERT INTO exercises (
          name_fr,
          name_en,
          aliases,
          movement_pattern,
          exercise_type,
          muscle_group,
          primary_muscles,
          secondary_muscles,
          stabilizers,
          equipment,
          equipment_alternatives,
          good_for,
          bad_for,
          modifications,
          difficulty,
          technique_cues,
          common_mistakes,
          source,
          video_url,
          is_custom,
          goal_scores,
          programming_priority,
          morpho_protocols,
          rest_modifiers,
          tempo_recommendations
        )
        VALUES (
          ${ex.name_fr},
          ${ex.name_en || null},
          ${ex.aliases || []},
          ${ex.movement_pattern},
          ${ex.exercise_type},
          ${ex.muscle_group},
          ${ex.primary_muscles || []},
          ${ex.secondary_muscles || []},
          ${ex.stabilizers || []},
          ${ex.equipment || []},
          ${ex.equipment_alternatives || []},
          ${JSON.stringify(ex.good_for || { morphotypes: [], conditions: [] })},
          ${JSON.stringify(ex.bad_for || { morphotypes: [], conditions: [] })},
          ${JSON.stringify(ex.modifications || [])},
          ${ex.difficulty || 'intermediate'},
          ${ex.technique_cues || []},
          ${ex.common_mistakes || []},
          ${ex.source || 'manual'},
          ${ex.video_url || null},
          false,
          ${JSON.stringify(ex.goal_scores || null)},
          ${ex.programming_priority || null},
          ${JSON.stringify(ex.morpho_protocols || null)},
          ${JSON.stringify(ex.rest_modifiers || null)},
          ${JSON.stringify(ex.tempo_recommendations || null)}
        )
      `;
      successCount++;
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`Error inserting exercise ${ex.name_fr}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nSeed complete!`);
  console.log(`Successfully inserted: ${successCount} exercises`);
  console.log(`Errors: ${errorCount}`);

  await sql.end();
}

// Run the seed
seedEnrichedExercises().catch(console.error);
