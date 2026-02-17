import { eq, and, gte, lte, count } from 'drizzle-orm'
import { practiceSessions, instruments, songs } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  try {
    const conditions = [eq(practiceSessions.userId, user.id)]

    if (query.instrumentId) {
      if (!UUID_RE.test(query.instrumentId as string)) {
        throw createError({ statusCode: 400, message: 'Invalid instrumentId format' })
      }
      conditions.push(eq(practiceSessions.instrumentId, query.instrumentId as string))
    }

    if (query.startDate) {
      conditions.push(gte(practiceSessions.startedAt, new Date(query.startDate as string)))
    }

    if (query.endDate) {
      conditions.push(lte(practiceSessions.startedAt, new Date(query.endDate as string)))
    }

    const where = and(...conditions)

    const [countRow] = await db.select({ count: count() }).from(practiceSessions).where(where)
    const total = countRow!.count

    const data = await db
      .select({
        id: practiceSessions.id,
        userId: practiceSessions.userId,
        instrumentId: practiceSessions.instrumentId,
        instrumentName: instruments.name,
        songId: practiceSessions.songId,
        songTitle: songs.title,
        startedAt: practiceSessions.startedAt,
        endedAt: practiceSessions.endedAt,
        durationSeconds: practiceSessions.durationSeconds,
        tempoBpm: practiceSessions.tempoBpm,
        notes: practiceSessions.notes,
        tags: practiceSessions.tags,
        createdAt: practiceSessions.createdAt,
      })
      .from(practiceSessions)
      .leftJoin(instruments, eq(practiceSessions.instrumentId, instruments.id))
      .leftJoin(songs, eq(practiceSessions.songId, songs.id))
      .where(where)
      .limit(limit)
      .offset(offset)

    return { data, total, page, limit }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch sessions' })
  }
})
