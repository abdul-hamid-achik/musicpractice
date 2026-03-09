import { eq, count } from 'drizzle-orm'
import { chords } from '../../db/schema'
import { createApiError, handleApiError } from '../../utils/errors'

const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const query = getQuery(event)

    const page = Math.max(1, parseInt(query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
    const offset = (page - 1) * limit

    const where = query.instrumentType
      ? (() => {
          if (!INSTRUMENT_TYPES.includes(query.instrumentType as typeof INSTRUMENT_TYPES[number])) {
            throw createApiError(`instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}`, 400)
          }
          return eq(chords.instrumentType, query.instrumentType as typeof INSTRUMENT_TYPES[number])
        })()
      : undefined

    const [countRow] = await db.select({ count: count() }).from(chords).where(where)
    const total = countRow!.count

    const data = await db.select().from(chords).where(where).limit(limit).offset(offset)

    return { data, total, page, limit }
  } catch (error) {
    return handleApiError(error, { route: '/api/chords', operation: 'list' })
  }
})
