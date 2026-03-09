import { eq } from 'drizzle-orm'
import { instruments } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'instrument id')

    const [deleted] = await db.delete(instruments).where(eq(instruments.id, validId)).returning()

    if (!deleted) {
      throw createApiError('Instrument not found', 404)
    }

    return { message: 'Instrument deleted', id: deleted.id }
  } catch (error) {
    if (error instanceof Error && error.message.includes('violates foreign key')) {
      return handleApiError(
        createApiError('Cannot delete instrument that is referenced by sessions or goals', 409),
        { route: '/api/instruments/[id]', operation: 'delete' }
      )
    }
    return handleApiError(error, { route: '/api/instruments/[id]', operation: 'delete' })
  }
})
