import { eq, and, count } from 'drizzle-orm'
import { userProgress, songs } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const query = getQuery(event)

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const offset = (page - 1) * limit

    const conditions = [eq(userProgress.userId, user.id)]

    if (query.songId) {
      validateId(query.songId as string, 'songId')
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
  } catch (error) {
    return handleApiError(error, { route: '/api/progress', operation: 'list' })
  }
})
