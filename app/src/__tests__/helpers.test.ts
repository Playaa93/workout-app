import { describe, it, expect } from 'vitest';
import {
  parseJsonArray,
  parseJson,
  toBool,
  fromBool,
  toNum,
  toJsonText,
  toJsonObjText,
  nowISO,
  todayStr,
} from '@/powersync/helpers';

describe('parseJsonArray', () => {
  it('parses valid JSON array', () => {
    expect(parseJsonArray('["a","b","c"]')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for null', () => {
    expect(parseJsonArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(parseJsonArray(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseJsonArray('')).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseJsonArray('not json')).toEqual([]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseJsonArray('{"key":"val"}')).toEqual([]);
  });

  it('parses typed arrays', () => {
    const result = parseJsonArray<number>('[1,2,3]');
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('parseJson', () => {
  it('parses valid JSON object', () => {
    expect(parseJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns null for null input', () => {
    expect(parseJson(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseJson(undefined)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseJson('not json')).toBeNull();
  });

  it('parses typed objects', () => {
    const result = parseJson<{ ecto: number; meso: number }>('{"ecto":3,"meso":5}');
    expect(result).toEqual({ ecto: 3, meso: 5 });
  });
});

describe('toBool / fromBool', () => {
  it('converts 1 to true', () => {
    expect(toBool(1)).toBe(true);
  });

  it('converts 0 to false', () => {
    expect(toBool(0)).toBe(false);
  });

  it('converts null to false', () => {
    expect(toBool(null)).toBe(false);
  });

  it('converts undefined to false', () => {
    expect(toBool(undefined)).toBe(false);
  });

  it('converts true to 1', () => {
    expect(fromBool(true)).toBe(1);
  });

  it('converts false to 0', () => {
    expect(fromBool(false)).toBe(0);
  });
});

describe('toNum', () => {
  it('parses valid decimal string', () => {
    expect(toNum('3.14')).toBe(3.14);
  });

  it('parses integer string', () => {
    expect(toNum('42')).toBe(42);
  });

  it('returns null for null', () => {
    expect(toNum(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toNum(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toNum('')).toBeNull();
  });

  it('returns null for non-numeric string', () => {
    expect(toNum('abc')).toBeNull();
  });

  it('parses negative numbers', () => {
    expect(toNum('-5.5')).toBe(-5.5);
  });
});

describe('toJsonText', () => {
  it('serializes array', () => {
    expect(toJsonText(['a', 'b'])).toBe('["a","b"]');
  });

  it('returns null for null', () => {
    expect(toJsonText(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(toJsonText(undefined)).toBeNull();
  });
});

describe('toJsonObjText', () => {
  it('serializes object', () => {
    expect(toJsonObjText({ key: 'val' })).toBe('{"key":"val"}');
  });

  it('returns null for null', () => {
    expect(toJsonObjText(null)).toBeNull();
  });
});

describe('todayStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = todayStr();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today date', () => {
    const d = new Date();
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(todayStr()).toBe(expected);
  });
});

describe('nowISO', () => {
  it('returns ISO 8601 string', () => {
    const result = nowISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('returns a parseable date', () => {
    const result = nowISO();
    const parsed = new Date(result);
    expect(parsed.getTime()).not.toBeNaN();
  });
});
