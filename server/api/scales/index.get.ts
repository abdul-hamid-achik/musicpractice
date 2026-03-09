import { eq, count } from 'drizzle-orm'
import { scales } from '../../db/schema'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const query = getQuery(event)

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const offset = (page - 1) * limit

    const where = query.category
      ? eq(scales.category, query.category as string)
      : undefined

    const [countRow] = await db.select({ count: count() }).from(scales).where(where)
    const total = countRow!.count

    const data = await db.select().from(scales).where(where).limit(limit).offset(offset)

    return { data, total, page, limit }
  } catch (error) {
    return handleApiError(error, { route: '/api/scales', operation: 'list' })
  }
})
