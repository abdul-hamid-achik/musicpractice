import { eq } from 'drizzle-orm'
import { practiceGoals, instruments } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid goal id is required' })
  }

  try {
    const [goal] = await db
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
      .where(eq(practiceGoals.id, id))

    if (!goal) {
      throw createError({ statusCode: 404, message: 'Goal not found' })
    }

    return goal
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch goal' })
  }
})
