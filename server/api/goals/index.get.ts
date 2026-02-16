import { eq, and, count } from 'drizzle-orm'
import { practiceGoals, instruments } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  try {
    const conditions = []

    if (query.userId) {
      if (!UUID_RE.test(query.userId as string)) {
        throw createError({ statusCode: 400, message: 'Invalid userId format' })
      }
      conditions.push(eq(practiceGoals.userId, query.userId as string))
    }

    if (query.isActive !== undefined) {
      const isActive = query.isActive === 'true'
      conditions.push(eq(practiceGoals.isActive, isActive))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

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
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch goals' })
  }
})
