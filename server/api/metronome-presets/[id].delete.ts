import { eq, and } from 'drizzle-orm'
import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'preset id')

    const [deleted] = await db.delete(metronomePresets)
      .where(and(eq(metronomePresets.id, validId), eq(metronomePresets.userId, user.id)))
      .returning()

    if (!deleted) {
      throw createApiError('Preset not found', 404)
    }

    return { message: 'Metronome preset deleted', id: deleted.id }
  } catch (error) {
    return handleApiError(error, { route: '/api/metronome-presets/[id]', operation: 'delete' })
  }
})
