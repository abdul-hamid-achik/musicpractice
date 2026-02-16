import { eq } from 'drizzle-orm'
import { instruments } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  if (query.type) {
    return db.select().from(instruments).where(eq(instruments.type, query.type as 'guitar' | 'bass' | 'piano' | 'violin'))
  }

  return db.select().from(instruments)
})
