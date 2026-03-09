import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { calculateStreakStatus } from '../../utils/streaks'
import { createApiError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()

    const [row] = await db
      .select({
        currentStreak: users.currentStreak,
        longestStreak: users.longestStreak,
        lastPracticeDate: users.lastPracticeDate,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)

    if (!row) {
      throw createApiError('User not found', 404)
    }

    const streak = calculateStreakStatus(row.lastPracticeDate, row.currentStreak, row.longestStreak)

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastPracticeDate: streak.lastPracticeDate,
      practicedToday: streak.practicedToday,
    }
  } catch (error) {
    return handleApiError(error, { route: '/api/streaks', operation: 'get' })
  }
})
