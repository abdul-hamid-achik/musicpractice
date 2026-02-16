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

  const body = await readBody(event)

  if (body.instrumentId !== undefined && body.instrumentId !== null && !UUID_RE.test(body.instrumentId)) {
    throw createError({ statusCode: 400, message: 'Invalid instrumentId format' })
  }
  if (body.targetMinutesPerWeek !== undefined && (!Number.isInteger(body.targetMinutesPerWeek) || body.targetMinutesPerWeek < 1)) {
    throw createError({ statusCode: 400, message: 'targetMinutesPerWeek must be a positive integer' })
  }

  try {
    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.instrumentId !== undefined) updates.instrumentId = body.instrumentId
    if (body.targetMinutesPerWeek !== undefined) updates.targetMinutesPerWeek = body.targetMinutesPerWeek
    if (body.isActive !== undefined) updates.isActive = body.isActive

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'No valid fields to update' })
    }

    const [goal] = await db.update(practiceGoals).set(updates).where(eq(practiceGoals.id, id)).returning()

    if (!goal) {
      throw createError({ statusCode: 404, message: 'Goal not found' })
    }

    return goal
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to update goal' })
  }
})
