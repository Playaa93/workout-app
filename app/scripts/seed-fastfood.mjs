/**
 * Seed fast-food items (McDonald's, Burger King, KFC, Subway, etc.)
 * Run: node scripts/seed-fastfood.mjs
 *
 * Valeurs nutritionnelles pour 1 portion (serving_size = poids en g d'1 unité)
 * Sources : sites officiels des enseignes + Open Food Facts
 */

const DB_URL = process.env.DATABASE_URL?.replace(/\\n$/, '');
if (!DB_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const { neon } = await import('@neondatabase/serverless');
const sql = neon(DB_URL);

const ITEMS = [
  // ===================== McDONALD'S =====================
  // Burgers
  { name: 'Big Mac', brand: "McDonald's", cal: 508, p: 26, c: 43, f: 25, fiber: 3, sugar: 8, serving: 200 },
  { name: 'Royal Cheese', brand: "McDonald's", cal: 520, p: 28, c: 38, f: 28, fiber: 2, sugar: 7, serving: 200 },
  { name: 'Royal Deluxe', brand: "McDonald's", cal: 560, p: 30, c: 39, f: 31, fiber: 2, sugar: 8, serving: 220 },
  { name: 'McChicken', brand: "McDonald's", cal: 400, p: 17, c: 42, f: 18, fiber: 2, sugar: 5, serving: 170 },
  { name: 'Filet-O-Fish', brand: "McDonald's", cal: 340, p: 15, c: 38, f: 14, fiber: 1, sugar: 5, serving: 140 },
  { name: 'Cheeseburger', brand: "McDonald's", cal: 300, p: 16, c: 30, f: 13, fiber: 1, sugar: 6, serving: 118 },
  { name: 'Double Cheeseburger', brand: "McDonald's", cal: 445, p: 26, c: 30, f: 24, fiber: 1, sugar: 6, serving: 165 },
  { name: 'Hamburger', brand: "McDonald's", cal: 250, p: 13, c: 30, f: 9, fiber: 1, sugar: 6, serving: 104 },
  { name: 'CBO (Chicken Bacon Onion)', brand: "McDonald's", cal: 565, p: 27, c: 44, f: 30, fiber: 2, sugar: 7, serving: 230 },
  { name: 'Big Tasty', brand: "McDonald's", cal: 840, p: 46, c: 50, f: 51, fiber: 3, sugar: 10, serving: 350 },
  { name: 'McFirst', brand: "McDonald's", cal: 310, p: 13, c: 33, f: 14, fiber: 2, sugar: 4, serving: 140 },
  { name: 'Chicken McNuggets x6', brand: "McDonald's", cal: 259, p: 15, c: 16, f: 15, fiber: 1, sugar: 0, serving: 96 },
  { name: 'Chicken McNuggets x9', brand: "McDonald's", cal: 389, p: 23, c: 24, f: 23, fiber: 1, sugar: 0, serving: 144 },
  { name: 'Chicken McNuggets x20', brand: "McDonald's", cal: 863, p: 50, c: 53, f: 50, fiber: 2, sugar: 1, serving: 320 },
  // Frites & accompagnements
  { name: 'Frites (petites)', brand: "McDonald's", cal: 230, p: 3, c: 29, f: 11, fiber: 3, sugar: 0, serving: 80 },
  { name: 'Frites (moyennes)', brand: "McDonald's", cal: 340, p: 4, c: 42, f: 17, fiber: 4, sugar: 0, serving: 114 },
  { name: 'Frites (grandes)', brand: "McDonald's", cal: 440, p: 5, c: 55, f: 22, fiber: 5, sugar: 0, serving: 150 },
  { name: 'Salade Caesar', brand: "McDonald's", cal: 180, p: 14, c: 8, f: 10, fiber: 2, sugar: 3, serving: 200 },
  { name: 'P\'tit wrap ranch', brand: "McDonald's", cal: 330, p: 13, c: 28, f: 18, fiber: 1, sugar: 3, serving: 120 },
  // Desserts & boissons
  { name: 'Sundae caramel', brand: "McDonald's", cal: 340, p: 7, c: 53, f: 10, fiber: 0, sugar: 45, serving: 180 },
  { name: 'Sundae chocolat', brand: "McDonald's", cal: 330, p: 7, c: 50, f: 10, fiber: 1, sugar: 43, serving: 180 },
  { name: 'McFlurry M&M\'s', brand: "McDonald's", cal: 450, p: 9, c: 62, f: 17, fiber: 1, sugar: 55, serving: 200 },
  { name: 'McFlurry Oreo', brand: "McDonald's", cal: 340, p: 8, c: 50, f: 12, fiber: 1, sugar: 42, serving: 180 },
  { name: 'Muffin chocolat', brand: "McDonald's", cal: 465, p: 6, c: 55, f: 24, fiber: 2, sugar: 32, serving: 130 },
  { name: 'Cookie', brand: "McDonald's", cal: 180, p: 2, c: 24, f: 8, fiber: 1, sugar: 14, serving: 40 },
  { name: 'Coca-Cola (moyen)', brand: "McDonald's", cal: 170, p: 0, c: 42, f: 0, fiber: 0, sugar: 42, serving: 400 },

  // ===================== BURGER KING =====================
  { name: 'Whopper', brand: 'Burger King', cal: 660, p: 28, c: 49, f: 40, fiber: 2, sugar: 11, serving: 270 },
  { name: 'Whopper Cheese', brand: 'Burger King', cal: 740, p: 33, c: 50, f: 45, fiber: 2, sugar: 11, serving: 300 },
  { name: 'Double Whopper', brand: 'Burger King', cal: 900, p: 49, c: 49, f: 56, fiber: 2, sugar: 11, serving: 374 },
  { name: 'Steakhouse', brand: 'Burger King', cal: 795, p: 40, c: 52, f: 46, fiber: 3, sugar: 9, serving: 310 },
  { name: 'Long Chicken', brand: 'Burger King', cal: 570, p: 22, c: 52, f: 30, fiber: 2, sugar: 6, serving: 220 },
  { name: 'Chicken Nuggets King x6', brand: 'Burger King', cal: 260, p: 14, c: 18, f: 14, fiber: 1, sugar: 0, serving: 100 },
  { name: 'Chicken Nuggets King x9', brand: 'Burger King', cal: 390, p: 21, c: 27, f: 21, fiber: 1, sugar: 0, serving: 150 },
  { name: 'King Fries (moyennes)', brand: 'Burger King', cal: 330, p: 4, c: 41, f: 16, fiber: 4, sugar: 0, serving: 116 },
  { name: 'King Fries (grandes)', brand: 'Burger King', cal: 430, p: 5, c: 53, f: 21, fiber: 5, sugar: 0, serving: 152 },
  { name: 'Onion Rings x8', brand: 'Burger King', cal: 320, p: 4, c: 38, f: 16, fiber: 2, sugar: 4, serving: 110 },
  { name: 'Chili Cheese Nuggets x6', brand: 'Burger King', cal: 280, p: 10, c: 20, f: 18, fiber: 1, sugar: 2, serving: 100 },
  { name: 'King Sundae', brand: 'Burger King', cal: 300, p: 6, c: 48, f: 9, fiber: 0, sugar: 40, serving: 170 },

  // ===================== KFC =====================
  { name: 'Bucket 6 Tenders', brand: 'KFC', cal: 660, p: 54, c: 42, f: 30, fiber: 2, sugar: 1, serving: 270 },
  { name: 'Tenders x3', brand: 'KFC', cal: 330, p: 27, c: 21, f: 15, fiber: 1, sugar: 0, serving: 135 },
  { name: 'Tenders x5', brand: 'KFC', cal: 550, p: 45, c: 35, f: 25, fiber: 1, sugar: 1, serving: 225 },
  { name: 'Double Krunch', brand: 'KFC', cal: 490, p: 22, c: 40, f: 27, fiber: 2, sugar: 5, serving: 200 },
  { name: 'Tower Burger', brand: 'KFC', cal: 560, p: 26, c: 44, f: 30, fiber: 2, sugar: 5, serving: 220 },
  { name: 'Mighty Bucket', brand: 'KFC', cal: 910, p: 42, c: 76, f: 47, fiber: 5, sugar: 5, serving: 400 },
  { name: 'Poulet Original (1 cuisse)', brand: 'KFC', cal: 290, p: 19, c: 9, f: 20, fiber: 0, sugar: 0, serving: 130 },
  { name: 'Poulet Original (1 pilon)', brand: 'KFC', cal: 170, p: 13, c: 6, f: 10, fiber: 0, sugar: 0, serving: 70 },
  { name: 'Coleslaw', brand: 'KFC', cal: 150, p: 1, c: 14, f: 10, fiber: 2, sugar: 10, serving: 120 },
  { name: 'Frites KFC (moyennes)', brand: 'KFC', cal: 320, p: 4, c: 40, f: 15, fiber: 3, sugar: 0, serving: 114 },

  // ===================== SUBWAY =====================
  { name: 'Sub Poulet Teriyaki 15cm', brand: 'Subway', cal: 370, p: 26, c: 48, f: 7, fiber: 4, sugar: 11, serving: 250 },
  { name: 'Sub Poulet Teriyaki 30cm', brand: 'Subway', cal: 740, p: 52, c: 96, f: 14, fiber: 8, sugar: 22, serving: 500 },
  { name: 'Sub Italian BMT 15cm', brand: 'Subway', cal: 410, p: 20, c: 44, f: 17, fiber: 3, sugar: 5, serving: 230 },
  { name: 'Sub Thon 15cm', brand: 'Subway', cal: 420, p: 19, c: 44, f: 19, fiber: 3, sugar: 5, serving: 250 },
  { name: 'Sub Steak & Cheese 15cm', brand: 'Subway', cal: 380, p: 24, c: 44, f: 12, fiber: 3, sugar: 7, serving: 240 },
  { name: 'Sub Veggie Delite 15cm', brand: 'Subway', cal: 230, p: 8, c: 44, f: 3, fiber: 4, sugar: 5, serving: 160 },
  { name: 'Sub Poulet rôti 15cm', brand: 'Subway', cal: 320, p: 24, c: 44, f: 5, fiber: 3, sugar: 5, serving: 230 },
  { name: 'Cookie Subway', brand: 'Subway', cal: 220, p: 2, c: 30, f: 10, fiber: 1, sugar: 18, serving: 45 },

  // ===================== KEBAB / TACOS =====================
  { name: 'Kebab galette (viande+salade+sauce)', brand: 'Kebab', cal: 760, p: 35, c: 60, f: 40, fiber: 3, sugar: 5, serving: 350 },
  { name: 'Kebab assiette (viande+frites+salade)', brand: 'Kebab', cal: 900, p: 40, c: 75, f: 48, fiber: 5, sugar: 4, serving: 500 },
  { name: 'Tacos simple (1 viande)', brand: 'Tacos', cal: 700, p: 30, c: 55, f: 38, fiber: 2, sugar: 3, serving: 350 },
  { name: 'Tacos double (2 viandes)', brand: 'Tacos', cal: 950, p: 42, c: 65, f: 52, fiber: 2, sugar: 4, serving: 450 },
  { name: 'Tacos triple (3 viandes)', brand: 'Tacos', cal: 1200, p: 55, c: 75, f: 68, fiber: 3, sugar: 5, serving: 550 },

  // ===================== PIZZA (1 part, pizza moyenne) =====================
  { name: 'Pizza Margherita (1 part)', brand: 'Pizza', cal: 220, p: 10, c: 26, f: 8, fiber: 2, sugar: 3, serving: 110 },
  { name: 'Pizza 4 Fromages (1 part)', brand: 'Pizza', cal: 280, p: 13, c: 25, f: 14, fiber: 1, sugar: 3, serving: 120 },
  { name: 'Pizza Reine/Regina (1 part)', brand: 'Pizza', cal: 240, p: 12, c: 26, f: 10, fiber: 2, sugar: 3, serving: 115 },
  { name: 'Pizza Calzone', brand: 'Pizza', cal: 750, p: 32, c: 70, f: 36, fiber: 4, sugar: 6, serving: 350 },

  // ===================== DOMINO'S =====================
  { name: 'Pizza Extravaganza (1 part)', brand: "Domino's", cal: 260, p: 12, c: 27, f: 12, fiber: 2, sugar: 3, serving: 120 },
  { name: 'Pizza Pepperoni (1 part)', brand: "Domino's", cal: 240, p: 10, c: 26, f: 10, fiber: 1, sugar: 3, serving: 110 },
  { name: 'Chicken Wings x6', brand: "Domino's", cal: 380, p: 28, c: 14, f: 24, fiber: 0, sugar: 2, serving: 180 },

  // ===================== STARBUCKS =====================
  { name: 'Caramel Frappuccino (Grande)', brand: 'Starbucks', cal: 420, p: 5, c: 66, f: 15, fiber: 0, sugar: 59, serving: 470 },
  { name: 'Latte (Grande)', brand: 'Starbucks', cal: 190, p: 13, c: 18, f: 7, fiber: 0, sugar: 17, serving: 470 },
  { name: 'Cappuccino (Grande)', brand: 'Starbucks', cal: 120, p: 8, c: 12, f: 4, fiber: 0, sugar: 11, serving: 470 },
  { name: 'Mocha (Grande)', brand: 'Starbucks', cal: 360, p: 13, c: 43, f: 15, fiber: 2, sugar: 35, serving: 470 },
  { name: 'Croissant', brand: 'Starbucks', cal: 260, p: 5, c: 28, f: 14, fiber: 1, sugar: 5, serving: 70 },

  // ===================== QUICK (Belgique/France) =====================
  { name: 'Giant', brand: 'Quick', cal: 580, p: 28, c: 40, f: 34, fiber: 2, sugar: 7, serving: 235 },
  { name: 'Long Bacon', brand: 'Quick', cal: 520, p: 22, c: 40, f: 30, fiber: 2, sugar: 5, serving: 200 },
  { name: 'Supreme Chicken', brand: 'Quick', cal: 470, p: 20, c: 42, f: 24, fiber: 2, sugar: 6, serving: 200 },

  // ===================== FIVE GUYS =====================
  { name: 'Cheeseburger', brand: 'Five Guys', cal: 840, p: 47, c: 40, f: 55, fiber: 2, sugar: 8, serving: 300 },
  { name: 'Little Cheeseburger', brand: 'Five Guys', cal: 550, p: 27, c: 39, f: 32, fiber: 2, sugar: 8, serving: 200 },
  { name: 'Frites (regular)', brand: 'Five Guys', cal: 530, p: 7, c: 62, f: 28, fiber: 6, sugar: 1, serving: 200 },
  { name: 'Hot Dog', brand: 'Five Guys', cal: 545, p: 18, c: 40, f: 35, fiber: 2, sugar: 7, serving: 180 },

  // ===================== BOISSONS COURANTES =====================
  { name: 'Coca-Cola (canette 33cl)', brand: 'Coca-Cola', cal: 139, p: 0, c: 35, f: 0, fiber: 0, sugar: 35, serving: 330 },
  { name: 'Coca-Cola Zero (canette 33cl)', brand: 'Coca-Cola', cal: 1, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, serving: 330 },
  { name: 'Sprite (canette 33cl)', brand: 'Sprite', cal: 132, p: 0, c: 33, f: 0, fiber: 0, sugar: 33, serving: 330 },
  { name: 'Fanta Orange (canette 33cl)', brand: 'Fanta', cal: 138, p: 0, c: 34, f: 0, fiber: 0, sugar: 34, serving: 330 },
  { name: 'Red Bull (canette 25cl)', brand: 'Red Bull', cal: 112, p: 0, c: 28, f: 0, fiber: 0, sugar: 27, serving: 250 },
  { name: 'Oasis Tropical (33cl)', brand: 'Oasis', cal: 112, p: 0, c: 28, f: 0, fiber: 0, sugar: 27, serving: 330 },
  { name: 'Ice Tea pêche (33cl)', brand: 'Lipton', cal: 99, p: 0, c: 24, f: 0, fiber: 0, sugar: 24, serving: 330 },

  // ===================== SNACKS COURANTS =====================
  { name: 'Croissant', brand: 'Boulangerie', cal: 270, p: 5, c: 28, f: 15, fiber: 1, sugar: 4, serving: 60 },
  { name: 'Pain au chocolat', brand: 'Boulangerie', cal: 320, p: 6, c: 35, f: 17, fiber: 2, sugar: 10, serving: 70 },
  { name: 'Croque-monsieur', brand: null, cal: 350, p: 18, c: 25, f: 20, fiber: 1, sugar: 3, serving: 150 },
  { name: 'Panini jambon fromage', brand: null, cal: 420, p: 20, c: 38, f: 20, fiber: 2, sugar: 3, serving: 200 },
  { name: 'Sandwich jambon beurre', brand: null, cal: 380, p: 16, c: 40, f: 17, fiber: 2, sugar: 3, serving: 180 },
  { name: 'Sandwich thon crudités', brand: null, cal: 350, p: 18, c: 38, f: 13, fiber: 3, sugar: 4, serving: 200 },
  { name: 'Salade César (restaurant)', brand: null, cal: 350, p: 22, c: 12, f: 24, fiber: 3, sugar: 3, serving: 250 },
  { name: 'Quiche Lorraine (1 part)', brand: null, cal: 380, p: 14, c: 22, f: 26, fiber: 1, sugar: 2, serving: 150 },
];

// Convert to per-100g values (since the DB stores per 100g)
const foods = ITEMS.map(item => {
  const s = item.serving;
  return {
    name: item.name,
    brand: item.brand,
    cal100: Math.round(item.cal / s * 100),
    p100: Math.round(item.p / s * 100 * 10) / 10,
    c100: Math.round(item.c / s * 100 * 10) / 10,
    f100: Math.round(item.f / s * 100 * 10) / 10,
    fiber100: Math.round((item.fiber || 0) / s * 100 * 10) / 10,
    sugar100: Math.round((item.sugar || 0) / s * 100 * 10) / 10,
    serving: s,
  };
});

console.log(`Inserting ${foods.length} fast-food items...`);

const BATCH_SIZE = 50;
let inserted = 0;

for (let i = 0; i < foods.length; i += BATCH_SIZE) {
  const batch = foods.slice(i, i + BATCH_SIZE);
  const values = batch.map(f => {
    const esc = (s) => s ? s.replace(/'/g, "''") : null;
    return `(
      '${esc(f.name)}',
      NULL,
      ${f.brand ? `'${esc(f.brand)}'` : 'NULL'},
      ${f.cal100},
      ${f.p100},
      ${f.c100},
      ${f.f100},
      ${f.fiber100},
      ${f.sugar100},
      NULL,
      ${f.serving}, 'g',
      false, true
    )`;
  }).join(',\n');

  const query = `
    INSERT INTO foods (name_fr, name_en, brand, calories, protein, carbohydrates, fat, fiber, sugar, sodium, serving_size, serving_unit, is_custom, verified)
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

console.log(`\nDone! ${inserted} fast-food items seeded.`);
