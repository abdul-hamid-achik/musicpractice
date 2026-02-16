import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid song id is required' })
  }

  try {
    const [deleted] = await db.delete(songs).where(eq(songs.id, id)).returning()

    if (!deleted) {
      throw createError({ statusCode: 404, message: 'Song not found' })
    }

    return { message: 'Song deleted', id: deleted.id }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to delete song' })
  }
})
