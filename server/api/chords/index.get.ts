import { eq, count } from 'drizzle-orm'
import { chords } from '../../db/schema'

const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const

export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)

  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const offset = (page - 1) * limit

  try {
    const where = query.instrumentType
      ? (() => {
          if (!INSTRUMENT_TYPES.includes(query.instrumentType as typeof INSTRUMENT_TYPES[number])) {
            throw createError({ statusCode: 400, message: `instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}` })
          }
          return eq(chords.instrumentType, query.instrumentType as typeof INSTRUMENT_TYPES[number])
        })()
      : undefined

    const [countRow] = await db.select({ count: count() }).from(chords).where(where)
    const total = countRow!.count

    const data = await db.select().from(chords).where(where).limit(limit).offset(offset)

    return { data, total, page, limit }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch chords' })
  }
})
