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
    const [deleted] = await db.delete(instruments).where(eq(instruments.id, id)).returning()

    if (!deleted) {
      throw createError({ statusCode: 404, message: 'Instrument not found' })
    }

    return { message: 'Instrument deleted', id: deleted.id }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    if (err instanceof Error && err.message.includes('violates foreign key')) {
      throw createError({ statusCode: 409, message: 'Cannot delete instrument that is referenced by sessions or goals' })
    }
    throw createError({ statusCode: 500, message: 'Failed to delete instrument' })
  }
})
