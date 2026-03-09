import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'song id')

    const [song] = await db.select().from(songs).where(eq(songs.id, validId))

    if (!song) {
      throw createApiError('Song not found', 404)
    }

    return song
  } catch (error) {
    return handleApiError(error, { route: '/api/songs/[id]', operation: 'get' })
  }
})
