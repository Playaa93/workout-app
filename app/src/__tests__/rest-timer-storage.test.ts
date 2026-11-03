import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSetRest, remainingSeconds, saveSetRest } from '@/lib/rest-timer-storage';

const key = 'workout.rest.v1.user.session';
const rest = { setId: 'set-a', endTime: 100_000, duration: 90 };

describe('rest timer recovery', () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('resumes the same set from its deadline, including a previous adjustment', () => {
    saveSetRest(key, rest);
    expect(remainingSeconds(readSetRest(key), 40_500)).toBe(60);
    const adjusted = { ...rest, endTime: 130_000, duration: 120 };
    saveSetRest(key, adjusted);
    expect(readSetRest(key)).toEqual(adjusted);
    expect(remainingSeconds(readSetRest(key), 121_250)).toBe(9);
    expect(remainingSeconds(readSetRest(key), 131_000)).toBe(0);
  });

  it('clears stopped timers and isolates workouts', () => {
    saveSetRest(key, rest);
    expect(readSetRest('another-workout')).toBeNull();
    saveSetRest(key, null);
    expect(readSetRest(key)).toBeNull();
  });

  it('ignores malformed and incomplete saved timers', () => {
    for (const raw of ['broken', 'null', '{}', JSON.stringify({ ...rest, endTime: 0 }), JSON.stringify({ ...rest, setId: '' })]) {
      sessionStorage.setItem(key, raw);
      expect(readSetRest(key)).toBeNull();
    }
  });

  it('can run without browser storage', () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(() => saveSetRest(key, rest)).not.toThrow();
    expect(readSetRest(key)).toBeNull();
  });
});
