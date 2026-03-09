import { eq } from 'drizzle-orm'
import { chords } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'chord id')

    const [chord] = await db.select().from(chords).where(eq(chords.id, validId))

    if (!chord) {
      throw createApiError('Chord not found', 404)
    }

    return chord
  } catch (error) {
    return handleApiError(error, { route: '/api/chords/[id]', operation: 'get' })
  }
})
