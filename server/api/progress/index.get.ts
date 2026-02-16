import { eq, and, count } from 'drizzle-orm'
import { userProgress, songs } from '../../db/schema'
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
    const conditions = [eq(userProgress.userId, user.id)]

    if (query.songId) {
      if (!UUID_RE.test(query.songId as string)) {
        throw createError({ statusCode: 400, message: 'Invalid songId format' })
      }
      conditions.push(eq(userProgress.songId, query.songId as string))
    }

    const where = and(...conditions)

    const [countRow] = await db.select({ count: count() }).from(userProgress).where(where)
    const total = countRow!.count

    const data = await db
      .select({
        id: userProgress.id,
        userId: userProgress.userId,
        songId: userProgress.songId,
        songTitle: songs.title,
        completionPercent: userProgress.completionPercent,
        maxTempoBpm: userProgress.maxTempoBpm,
        lastPracticedAt: userProgress.lastPracticedAt,
        practiceCount: userProgress.practiceCount,
      })
      .from(userProgress)
      .leftJoin(songs, eq(userProgress.songId, songs.id))
      .where(where)
      .limit(limit)
      .offset(offset)

    return { data, total, page, limit }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch progress' })
  }
})
