import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
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
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Check if streak is still active (last practice was today or yesterday)
  let activeToday = false
  if (row.lastPracticeDate) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    activeToday = row.lastPracticeDate === todayStr || row.lastPracticeDate === yesterdayStr
  }

  return {
    currentStreak: activeToday ? row.currentStreak : 0,
    longestStreak: row.longestStreak,
    lastPracticeDate: row.lastPracticeDate,
    practicedToday: row.lastPracticeDate === new Date().toISOString().split('T')[0],
  }
})
