/**
 * Tests for server/utils/streaks.ts
 *
 * The streak utilities are pure functions of (date, currentStreak, longestStreak).
 * We don't mock anything — we just feed each branch a representative date and
 * assert the resulting math + flags.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateStreakStatus,
  calculateStreakUpdate,
  getTodayStr,
  getYesterdayStr,
} from './streaks';

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0] ?? '';
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

describe('getTodayStr / getYesterdayStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const today = getTodayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('yesterday is exactly one day before today', () => {
    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    const todayDate = new Date(today);
    const yesterdayDate = new Date(yesterday);
    const diffMs = todayDate.getTime() - yesterdayDate.getTime();
    // 24h (allow slight DST skew)
    expect(diffMs).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000);
    expect(diffMs).toBeLessThanOrEqual(25 * 60 * 60 * 1000);
  });
});

describe('calculateStreakStatus', () => {
  it('returns practicedToday=true and isStreakActive=true when lastPractice is today', () => {
    const today = getTodayStr();
    const result = calculateStreakStatus(today, 5, 10);
    expect(result.practicedToday).toBe(true);
    expect(result.isStreakActive).toBe(true);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(10);
    expect(result.lastPracticeDate).toBe(today);
  });

  it('returns practicedToday=false but isStreakActive=true when last practiced yesterday', () => {
    const yesterday = getYesterdayStr();
    const result = calculateStreakStatus(yesterday, 3, 7);
    expect(result.practicedToday).toBe(false);
    expect(result.isStreakActive).toBe(true);
    expect(result.currentStreak).toBe(3);
  });

  it('returns streak=0 and isStreakActive=false when last practice was >1 day ago', () => {
    const result = calculateStreakStatus(daysAgo(3), 4, 9);
    expect(result.practicedToday).toBe(false);
    expect(result.isStreakActive).toBe(false);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(9);
  });

  it('returns streak=0 when never practiced (null)', () => {
    const result = calculateStreakStatus(null, 0, 0);
    expect(result.practicedToday).toBe(false);
    expect(result.isStreakActive).toBe(false);
    expect(result.currentStreak).toBe(0);
    expect(result.lastPracticeDate).toBeNull();
  });
});

describe('calculateStreakUpdate', () => {
  it('keeps currentStreak unchanged when already practiced today', () => {
    const today = getTodayStr();
    const result = calculateStreakUpdate(today, 7, 12);
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(12);
    expect(result.today).toBe(today);
  });

  it('extends currentStreak by 1 when practiced yesterday', () => {
    const yesterday = getYesterdayStr();
    const result = calculateStreakUpdate(yesterday, 7, 12);
    expect(result.currentStreak).toBe(8);
    expect(result.longestStreak).toBe(12);
  });

  it('resets currentStreak to 1 when last practice was >1 day ago', () => {
    const result = calculateStreakUpdate(daysAgo(5), 10, 20);
    expect(result.currentStreak).toBe(1);
    // longest never decreases
    expect(result.longestStreak).toBe(20);
  });

  it('resets currentStreak to 1 when never practiced (null)', () => {
    const result = calculateStreakUpdate(null, 0, 0);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('updates longestStreak when current exceeds previous longest', () => {
    const yesterday = getYesterdayStr();
    const result = calculateStreakUpdate(yesterday, 14, 10);
    expect(result.currentStreak).toBe(15);
    expect(result.longestStreak).toBe(15);
  });

  it('longestStreak never decreases on reset', () => {
    const result = calculateStreakUpdate(daysAgo(7), 0, 50);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(50);
  });

  it('returns today in YYYY-MM-DD format', () => {
    const result = calculateStreakUpdate(null, 0, 0);
    expect(result.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('streak edge cases at the day boundary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats "today" relative to current fake clock', () => {
    // Pin time to a fixed instant
    const fixed = new Date('2026-03-15T10:00:00.000Z');
    vi.setSystemTime(fixed);
    const today = getTodayStr();
    expect(today).toBe('2026-03-15');
    // Yesterday
    const result = calculateStreakStatus('2026-03-14', 4, 4);
    expect(result.practicedToday).toBe(false);
    expect(result.isStreakActive).toBe(true);
  });
});
