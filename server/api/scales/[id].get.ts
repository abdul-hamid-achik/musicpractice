import { eq } from 'drizzle-orm'
import { scales } from '../../db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid scale id is required' })
  }

  try {
    const [scale] = await db.select().from(scales).where(eq(scales.id, id))

    if (!scale) {
      throw createError({ statusCode: 404, message: 'Scale not found' })
    }

    return scale
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch scale' })
  }
})
