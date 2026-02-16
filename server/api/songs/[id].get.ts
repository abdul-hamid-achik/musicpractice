import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Song id is required' })
  }

  const [song] = await db.select().from(songs).where(eq(songs.id, id))

  if (!song) {
    throw createError({ statusCode: 404, message: 'Song not found' })
  }

  return song
})
