import { eq } from 'drizzle-orm'
import { scales } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'scale id')

    const [scale] = await db.select().from(scales).where(eq(scales.id, validId))

    if (!scale) {
      throw createApiError('Scale not found', 404)
    }

    return scale
  } catch (error) {
    return handleApiError(error, { route: '/api/scales/[id]', operation: 'get' })
  }
})
