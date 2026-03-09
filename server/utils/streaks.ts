/**
 * Shared streak calculation utilities for MusicPractice application.
 * Provides consistent streak logic across session creation and streak retrieval.
 */

export interface StreakResult {
  /** Current streak value to display */
  currentStreak: number
  /** Longest streak ever achieved */
  longestStreak: number
  /** Whether the user practiced today */
  practicedToday: boolean
  /** Whether the streak is still active (practiced today or yesterday) */
  isStreakActive: boolean
  /** Date of last practice in YYYY-MM-DD format */
  lastPracticeDate: string | null
}

export interface StreakUpdateResult {
  /** New current streak value */
  currentStreak: number
  /** New longest streak value */
  longestStreak: number
  /** Today's date in YYYY-MM-DD format */
  today: string
}

/**
 * Get today's date as a YYYY-MM-DD string
 */
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

/**
 * Get yesterday's date as a YYYY-MM-DD string
 */
export function getYesterdayStr(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0] ?? ''
}

/**
 * Calculate streak status based on last practice date and current streak.
 * 
 * Logic:
 * - If practiced today: streak is active, show currentStreak from DB
 * - If practiced yesterday but not today: streak is still valid (not broken), 
 *   show currentStreak but mark as not active today (waiting for next practice to extend)
 * - If last practice was >1 day ago: streak is broken, return 0
 * 
 * @param lastPracticeDate - Last practice date in YYYY-MM-DD format or null
 * @param currentStreak - Current streak value from database
 * @param longestStreak - Longest streak value from database
 */
export function calculateStreakStatus(
  lastPracticeDate: string | null,
  currentStreak: number,
  longestStreak: number
): StreakResult {
  const todayStr = getTodayStr()
  const yesterdayStr = getYesterdayStr()

  const practicedToday = lastPracticeDate === todayStr
  const practicedYesterday = lastPracticeDate === yesterdayStr

  // Streak is active if practiced today or yesterday
  const isStreakActive = practicedToday || practicedYesterday

  // If last practice was more than 1 day ago, streak is broken
  const displayStreak = isStreakActive ? currentStreak : 0

  return {
    currentStreak: displayStreak,
    longestStreak,
    practicedToday,
    isStreakActive,
    lastPracticeDate,
  }
}

/**
 * Calculate new streak values when a practice session is saved.
 * 
 * Logic:
 * - If already practiced today: keep streak as-is (don't double-count)
 * - If practiced yesterday: extend streak by 1
 * - If last practice was >1 day ago or never practiced: reset streak to 1
 * 
 * @param lastPracticeDate - Last practice date in YYYY-MM-DD format or null
 * @param currentStreak - Current streak value from database
 * @param longestStreak - Longest streak value from database
 */
export function calculateStreakUpdate(
  lastPracticeDate: string | null,
  currentStreak: number,
  longestStreak: number
): StreakUpdateResult {
  const todayStr = getTodayStr()
  const yesterdayStr = getYesterdayStr()

  let newStreak: number

  if (lastPracticeDate === todayStr) {
    // Already practiced today — keep streak as-is (don't double-count)
    newStreak = currentStreak
  } else if (lastPracticeDate === yesterdayStr) {
    // Practiced yesterday — extend streak
    newStreak = currentStreak + 1
  } else {
    // Missed a day or first session ever — reset to 1
    newStreak = 1
  }

  const newLongest = Math.max(longestStreak, newStreak)

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    today: todayStr,
  }
}
