import { eq, and, count, like, or } from 'drizzle-orm'
import { songs } from '../../db/schema'
import { createApiError, handleApiError } from '../../utils/errors'

const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const query = getQuery(event)

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const offset = (page - 1) * limit

    const conditions = []

    // Search by title or artist (case-insensitive)
    if (query.search && typeof query.search === 'string') {
      const searchTerm = `%${query.search.toLowerCase()}%`
      conditions.push(
        or(
          like(songs.title, searchTerm),
          like(songs.artist, searchTerm),
        ),
      )
    }

    if (query.instrumentType) {
      if (!INSTRUMENT_TYPES.includes(query.instrumentType as typeof INSTRUMENT_TYPES[number])) {
        throw createApiError(`instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}`, 400)
      }
      conditions.push(eq(songs.instrumentType, query.instrumentType as typeof INSTRUMENT_TYPES[number]))
    }

    if (query.difficulty) {
      if (!DIFFICULTIES.includes(query.difficulty as typeof DIFFICULTIES[number])) {
        throw createApiError(`difficulty must be one of: ${DIFFICULTIES.join(', ')}`, 400)
      }
      conditions.push(eq(songs.difficulty, query.difficulty as typeof DIFFICULTIES[number]))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [countRow] = await db.select({ count: count() }).from(songs).where(where)
    const total = countRow!.count

    const data = await db.select().from(songs).where(where).limit(limit).offset(offset)

    return { data, total, page, limit }
  } catch (error) {
    return handleApiError(error, { route: '/api/songs', operation: 'list' })
  }
})
