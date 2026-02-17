/**
 * Seed the foods table from CIQUAL 2020 XML data (ANSES open data).
 * Run: node scripts/seed-foods-ciqual.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Nutrient codes we care about
const NUTRIENTS = {
  '328': 'calories',     // kcal/100g
  '25000': 'protein',    // g/100g
  '31000': 'carbs',      // g/100g
  '40000': 'fat',        // g/100g
  '34100': 'fiber',      // g/100g
  '32000': 'sugar',      // g/100g
  '10110': 'sodium',     // mg/100g
};

function parseXml(content, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g');
  const items = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function getField(block, field) {
  const regex = new RegExp(`<${field}>\\s*(.*?)\\s*<\\/${field}>`);
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

// Parse foods
const alimentsXml = fs.readFileSync('/tmp/ciqual/alim_2020_07_07.xml', 'latin1');
const foodBlocks = parseXml(alimentsXml, 'ALIM');

const foodsMap = new Map();
for (const block of foodBlocks) {
  const code = getField(block, 'alim_code');
  const nameFr = getField(block, 'alim_nom_fr');
  const nameEn = getField(block, 'alim_nom_eng');
  if (code && nameFr) {
    foodsMap.set(code, { code, nameFr, nameEn, calories: null, protein: null, carbs: null, fat: null, fiber: null, sugar: null, sodium: null });
  }
}
console.log(`Parsed ${foodsMap.size} foods`);

// Parse compositions
const compoXml = fs.readFileSync('/tmp/ciqual/compo_2020_07_07.xml', 'latin1');
const compoBlocks = parseXml(compoXml, 'COMPO');

for (const block of compoBlocks) {
  const alimentCode = getField(block, 'alim_code');
  const constCode = getField(block, 'const_code');
  const teneur = getField(block, 'teneur');

  if (!alimentCode || !constCode || !teneur) continue;
  const nutrient = NUTRIENTS[constCode];
  if (!nutrient) continue;

  const food = foodsMap.get(alimentCode);
  if (!food) continue;

  // Parse value (handle traces, "<", "-", etc.)
  const cleaned = teneur.replace(',', '.').replace('<', '').replace('traces', '0').replace('-', '').trim();
  const value = parseFloat(cleaned);
  if (!isNaN(value)) {
    food[nutrient] = value;
  }
}

// Filter: keep only foods with at least calories
const foods = Array.from(foodsMap.values()).filter(f => f.calories !== null && f.calories > 0);
console.log(`${foods.length} foods with calorie data`);

// Build SQL inserts in batches
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

const { neon } = await import('@neondatabase/serverless');
const sql = neon(DB_URL);

const BATCH_SIZE = 100;
let inserted = 0;

for (let i = 0; i < foods.length; i += BATCH_SIZE) {
  const batch = foods.slice(i, i + BATCH_SIZE);
  const values = batch.map(f => {
    const esc = (s) => s ? s.replace(/'/g, "''") : null;
    return `(
      '${esc(f.nameFr)}',
      ${f.nameEn ? `'${esc(f.nameEn)}'` : 'NULL'},
      ${f.calories ?? 'NULL'},
      ${f.protein ?? 'NULL'},
      ${f.carbs ?? 'NULL'},
      ${f.fat ?? 'NULL'},
      ${f.fiber ?? 'NULL'},
      ${f.sugar ?? 'NULL'},
      ${f.sodium ?? 'NULL'},
      100, 'g', false, true
    )`;
  }).join(',\n');

  const query = `
    INSERT INTO foods (name_fr, name_en, calories, protein, carbohydrates, fat, fiber, sugar, sodium, serving_size, serving_unit, is_custom, verified)
    VALUES ${values}
    ON CONFLICT DO NOTHING
  `;

  try {
    await sql.query(query);
    inserted += batch.length;
    process.stdout.write(`\r${inserted}/${foods.length} inserted`);
  } catch (err) {
    console.error(`\nError at batch ${i}:`, err.message);
  }
}

console.log(`\nDone! ${inserted} foods seeded.`);
