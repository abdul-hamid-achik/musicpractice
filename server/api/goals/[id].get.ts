import { eq } from 'drizzle-orm'
import { practiceGoals, instruments } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'goal id')

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
      .where(eq(practiceGoals.id, validId))

    if (!goal) {
      throw createApiError('Goal not found', 404)
    }

    return goal
  } catch (error) {
    return handleApiError(error, { route: '/api/goals/[id]', operation: 'get' })
  }
})
