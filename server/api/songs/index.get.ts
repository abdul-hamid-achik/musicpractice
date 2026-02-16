import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  if (query.instrumentType) {
    return db.select().from(songs).where(eq(songs.instrumentType, query.instrumentType as 'guitar' | 'bass' | 'piano' | 'violin'))
  }

  return db.select().from(songs)
})
