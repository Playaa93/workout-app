import { describe, it, expect } from 'vitest';
import { getXpForLevel, calculateLevel } from '@/lib/xp-utils';

describe('getXpForLevel', () => {
  it('returns 100 for level 1', () => {
    expect(getXpForLevel(1)).toBe(100);
  });

  it('returns 150 for level 2', () => {
    expect(getXpForLevel(2)).toBe(150);
  });

  it('returns 225 for level 3', () => {
    expect(getXpForLevel(3)).toBe(225);
  });

  it('grows exponentially', () => {
    const l5 = getXpForLevel(5);
    const l10 = getXpForLevel(10);
    expect(l10).toBeGreaterThan(l5 * 2);
  });
});

describe('calculateLevel', () => {
  it('returns level 1 for 0 XP', () => {
    const result = calculateLevel(0);
    expect(result.level).toBe(1);
    expect(result.xpInCurrentLevel).toBe(0);
    expect(result.xpToNext).toBe(100);
  });

  it('returns level 1 for 50 XP', () => {
    const result = calculateLevel(50);
    expect(result.level).toBe(1);
    expect(result.xpInCurrentLevel).toBe(50);
    expect(result.xpToNext).toBe(100);
  });

  it('returns level 2 for exactly 100 XP', () => {
    const result = calculateLevel(100);
    expect(result.level).toBe(2);
    expect(result.xpInCurrentLevel).toBe(0);
    expect(result.xpToNext).toBe(150);
  });

  it('returns level 2 for 200 XP', () => {
    const result = calculateLevel(200);
    expect(result.level).toBe(2);
    expect(result.xpInCurrentLevel).toBe(100);
    expect(result.xpToNext).toBe(150);
  });

  it('returns level 3 for 250 XP (100+150)', () => {
    const result = calculateLevel(250);
    expect(result.level).toBe(3);
    expect(result.xpInCurrentLevel).toBe(0);
    expect(result.xpToNext).toBe(225);
  });

  it('handles large XP values', () => {
    const result = calculateLevel(100000);
    expect(result.level).toBeGreaterThan(10);
    expect(result.xpInCurrentLevel).toBeGreaterThanOrEqual(0);
    expect(result.xpInCurrentLevel).toBeLessThan(result.xpToNext);
  });

  it('xpInCurrentLevel is always less than xpToNext', () => {
    for (const xp of [0, 1, 50, 99, 100, 250, 500, 1000, 5000]) {
      const result = calculateLevel(xp);
      expect(result.xpInCurrentLevel).toBeLessThan(result.xpToNext);
    }
  });
});
