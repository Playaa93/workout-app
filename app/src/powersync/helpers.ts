// Helpers for converting between PowerSync SQLite types and app types

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
  return crypto.randomUUID();
}

/** Convert a Date to SQLite/PostgreSQL-compatible timestamp (space separator) */
export function toSqliteTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ');
}

/** Get current timestamp string (space separator to match PostgreSQL format) */
export function nowISO(): string {
  return toSqliteTimestamp(new Date());
}

/** Get today's date as YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Convert local date (YYYY-MM-DD) to UTC timestamp bounds.
 *  Parses as local time (no Z) so toISOString shifts by timezone offset. */
export function localDayBoundsUTC(dateStr: string): { start: string; end: string } {
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start: toSqliteTimestamp(start),
    end: toSqliteTimestamp(end),
  };
}
