import { eq } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  if (query.userId) {
    return db.select().from(practiceSessions).where(eq(practiceSessions.userId, query.userId as string))
  }

  if (query.instrumentId) {
    return db.select().from(practiceSessions).where(eq(practiceSessions.instrumentId, query.instrumentId as string))
  }

  return db.select().from(practiceSessions)
})
