import { eq, count } from 'drizzle-orm'
import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  try {
    const where = query.userId
      ? (() => {
          if (!UUID_RE.test(query.userId as string)) {
            throw createError({ statusCode: 400, message: 'Invalid userId format' })
          }
          return eq(metronomePresets.userId, query.userId as string)
        })()
      : undefined

    const [countRow] = await db.select({ count: count() }).from(metronomePresets).where(where)
    const total = countRow!.count

    const data = await db.select().from(metronomePresets).where(where).limit(limit).offset(offset)

    return { data, total, page, limit }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch metronome presets' })
  }
})
