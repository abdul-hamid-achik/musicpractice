import { eq } from 'drizzle-orm'
import { instruments } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'instrument id')

    const [instrument] = await db.select().from(instruments).where(eq(instruments.id, validId))

    if (!instrument) {
      throw createApiError('Instrument not found', 404)
    }

    return instrument
  } catch (error) {
    return handleApiError(error, { route: '/api/instruments/[id]', operation: 'get' })
  }
})
