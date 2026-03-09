import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'song id')

    const [deleted] = await db.delete(songs).where(eq(songs.id, validId)).returning()

    if (!deleted) {
      throw createApiError('Song not found', 404)
    }

    return { message: 'Song deleted', id: deleted.id }
  } catch (error) {
    return handleApiError(error, { route: '/api/songs/[id]', operation: 'delete' })
  }
})
