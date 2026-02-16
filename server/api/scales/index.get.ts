import { eq } from 'drizzle-orm'
import { scales } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  if (query.category) {
    return db.select().from(scales).where(eq(scales.category, query.category as string))
  }

  return db.select().from(scales)
})
