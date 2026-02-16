import { eq } from 'drizzle-orm'
import { chords } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  if (query.instrumentType) {
    return db.select().from(chords).where(eq(chords.instrumentType, query.instrumentType as 'guitar' | 'bass' | 'piano' | 'violin'))
  }

  return db.select().from(chords)
})
