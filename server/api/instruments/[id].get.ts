import { eq } from 'drizzle-orm'
import { instruments } from '../../db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid instrument id is required' })
  }

  try {
    const [instrument] = await db.select().from(instruments).where(eq(instruments.id, id))

    if (!instrument) {
      throw createError({ statusCode: 404, message: 'Instrument not found' })
    }

    return instrument
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch instrument' })
  }
})
