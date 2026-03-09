import { eq } from 'drizzle-orm'
import { practiceGoals } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'goal id')

    const [deleted] = await db.delete(practiceGoals).where(eq(practiceGoals.id, validId)).returning()

    if (!deleted) {
      throw createApiError('Goal not found', 404)
    }

    return { message: 'Goal deleted', id: deleted.id }
  } catch (error) {
    return handleApiError(error, { route: '/api/goals/[id]', operation: 'delete' })
  }
})
