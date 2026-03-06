import * as Crypto from 'expo-crypto';

/** Parse JSON text column back to array, returns empty array on null/invalid */
export function parseJsonArray<T = string>(val: string | null | undefined): T[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Parse JSON text column back to object, returns null on null/invalid */
export function parseJson<T = Record<string, unknown>>(val: string | null | undefined): T | null {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

/** SQLite integer (0/1) to boolean */
export function toBool(val: number | null | undefined): boolean {
  return val === 1;
}

/** Boolean to SQLite integer (0/1) */
export function fromBool(val: boolean): number {
  return val ? 1 : 0;
}

/** Parse decimal text to number, returns null on null/invalid */
export function toNum(val: string | null | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/** Serialize array to JSON text for storage */
export function toJsonText(val: unknown[] | null | undefined): string | null {
  if (!val) return null;
  return JSON.stringify(val);
}

/** Serialize object to JSON text for storage */
export function toJsonObjText(val: Record<string, unknown> | null | undefined): string | null {
  if (!val) return null;
  return JSON.stringify(val);
}

/** Generate a UUID v4 */
export function uuid(): string {
  return Crypto.randomUUID();
}

/** Get current ISO timestamp string */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Get today's date as YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
