export type MacroInput = {
  name?: string | null;
  brand?: string | null;
  calories?: number | string | null;
  protein?: number | string | null;
  carbohydrates?: number | string | null;
  fat?: number | string | null;
};

export type MacroValidationResult = {
  valid: boolean;
  errors: string[];
  sanitized: { brand: string | null };
};

const MAX_KCAL_PER_100G = 950;
const MAX_MACRO_GRAMS_PER_100G = 100;
const MAX_MACRO_SUM_PER_100G = 105;
const ATWATER_TOLERANCE = 0.5;
const ATWATER_COEFFS = { protein: 4, carbs: 4, fat: 9 } as const;
const BRAND_MAX_LENGTH = 40;
const BRAND_DESCRIPTION_HINTS = [
  'à base de', 'a base de', 'avec des', 'avec de la', 'avec du',
  'composé de', 'compose de', 'riche en', 'type ', 'sorte de',
];

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
};

function sanitizeBrand(rawBrand: string | null | undefined, name: string): string | null {
  const brand = rawBrand?.trim() || null;
  if (!brand) return null;
  if (name && brand.toLowerCase() === name.toLowerCase()) return null;
  if (brand.length > BRAND_MAX_LENGTH) return null;
  const brandLower = brand.toLowerCase();
  if (BRAND_DESCRIPTION_HINTS.some(hint => brandLower.includes(hint))) return null;
  return brand;
}

export function validateAndSanitizeMacros(input: MacroInput): MacroValidationResult {
  const errors: string[] = [];
  const cal = num(input.calories);
  const p = num(input.protein);
  const c = num(input.carbohydrates);
  const f = num(input.fat);
  const sum = p + c + f;
  const atwater = ATWATER_COEFFS.protein * p + ATWATER_COEFFS.carbs * c + ATWATER_COEFFS.fat * f;

  if (cal < 0 || p < 0 || c < 0 || f < 0) errors.push('macros_negatives');
  if (cal > MAX_KCAL_PER_100G) errors.push(`calories_too_high:${cal}`);
  if (p > MAX_MACRO_GRAMS_PER_100G) errors.push(`protein_too_high:${p}`);
  if (c > MAX_MACRO_GRAMS_PER_100G) errors.push(`carbs_too_high:${c}`);
  if (f > MAX_MACRO_GRAMS_PER_100G) errors.push(`fat_too_high:${f}`);
  if (sum > MAX_MACRO_SUM_PER_100G) errors.push(`macros_sum_too_high:${sum.toFixed(1)}`);

  // Atwater coherence skipped for alcohols (p+c+f ≈ 0 mais cal > 0 dû à l'éthanol non comptabilisé).
  if (cal > 50 && sum > 5 && atwater > 0) {
    const diffPct = Math.abs(cal - atwater) / cal;
    if (diffPct > ATWATER_TOLERANCE) {
      errors.push(`atwater_incoherent:cal=${cal},computed=${atwater.toFixed(0)}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: { brand: sanitizeBrand(input.brand, input.name?.trim() || '') },
  };
}
