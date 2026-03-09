import { eq, and, count } from 'drizzle-orm'
import { practiceGoals, instruments } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const query = getQuery(event)

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const offset = (page - 1) * limit

    const conditions = [eq(practiceGoals.userId, user.id)]

    if (query.isActive !== undefined) {
      const isActive = query.isActive === 'true'
      conditions.push(eq(practiceGoals.isActive, isActive))
    }

    const where = and(...conditions)

    const [countRow] = await db.select({ count: count() }).from(practiceGoals).where(where)
    const total = countRow!.count

    const data = await db
      .select({
        id: practiceGoals.id,
        userId: practiceGoals.userId,
        instrumentId: practiceGoals.instrumentId,
        instrumentName: instruments.name,
        title: practiceGoals.title,
        description: practiceGoals.description,
        targetMinutesPerWeek: practiceGoals.targetMinutesPerWeek,
        isActive: practiceGoals.isActive,
        createdAt: practiceGoals.createdAt,
      })
      .from(practiceGoals)
      .leftJoin(instruments, eq(practiceGoals.instrumentId, instruments.id))
      .where(where)
      .limit(limit)
      .offset(offset)

    return { data, total, page, limit }
  } catch (error) {
    return handleApiError(error, { route: '/api/goals', operation: 'list' })
  }
})
