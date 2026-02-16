import { eq } from 'drizzle-orm'
import { practiceGoals } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid goal id is required' })
  }

  try {
    const [deleted] = await db.delete(practiceGoals).where(eq(practiceGoals.id, id)).returning()

    if (!deleted) {
      throw createError({ statusCode: 404, message: 'Goal not found' })
    }

    return { message: 'Goal deleted', id: deleted.id }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to delete goal' })
  }
})
