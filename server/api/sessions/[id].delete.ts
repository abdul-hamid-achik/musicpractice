import { eq } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'session id')

    const [deleted] = await db.delete(practiceSessions).where(eq(practiceSessions.id, validId)).returning()

    if (!deleted) {
      throw createApiError('Session not found', 404)
    }

    return { message: 'Session deleted', id: deleted.id }
  } catch (error) {
    return handleApiError(error, { route: '/api/sessions/[id]', operation: 'delete' })
  }
})
