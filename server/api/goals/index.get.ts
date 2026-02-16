import { eq } from 'drizzle-orm'
import { practiceGoals } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  if (query.userId) {
    return db.select().from(practiceGoals).where(eq(practiceGoals.userId, query.userId as string))
  }

  return db.select().from(practiceGoals)
})
