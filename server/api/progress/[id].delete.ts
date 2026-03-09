import { eq } from 'drizzle-orm'
import { userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'progress id')

    const [deleted] = await db.delete(userProgress).where(eq(userProgress.id, validId)).returning()

    if (!deleted) {
      throw createApiError('Progress not found', 404)
    }

    return { message: 'Progress deleted', id: deleted.id }
  } catch (error) {
    return handleApiError(error, { route: '/api/progress/[id]', operation: 'delete' })
  }
})
