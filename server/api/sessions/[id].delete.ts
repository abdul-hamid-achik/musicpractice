import { eq } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid session id is required' })
  }

  try {
    const [deleted] = await db.delete(practiceSessions).where(eq(practiceSessions.id, id)).returning()

    if (!deleted) {
      throw createError({ statusCode: 404, message: 'Session not found' })
    }

    return { message: 'Session deleted', id: deleted.id }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to delete session' })
  }
})
