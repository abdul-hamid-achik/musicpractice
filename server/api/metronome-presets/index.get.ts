import { eq, count } from 'drizzle-orm'
import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const query = getQuery(event)

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const offset = (page - 1) * limit

    const where = eq(metronomePresets.userId, user.id)

    const [countRow] = await db.select({ count: count() }).from(metronomePresets).where(where)
    const total = countRow!.count

    const data = await db.select().from(metronomePresets).where(where).limit(limit).offset(offset)

    return { data, total, page, limit }
  } catch (error) {
    return handleApiError(error, { route: '/api/metronome-presets', operation: 'list' })
  }
})
