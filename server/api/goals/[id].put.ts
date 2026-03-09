import { eq } from 'drizzle-orm'
import { practiceGoals } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'goal id')

    const body = await readBody(event)

    if (body.instrumentId !== undefined && body.instrumentId !== null) {
      validateId(body.instrumentId, 'instrumentId')
    }
    if (body.targetMinutesPerWeek !== undefined && (!Number.isInteger(body.targetMinutesPerWeek) || body.targetMinutesPerWeek < 1)) {
      throw createApiError('targetMinutesPerWeek must be a positive integer', 400)
    }

    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.instrumentId !== undefined) updates.instrumentId = body.instrumentId
    if (body.targetMinutesPerWeek !== undefined) updates.targetMinutesPerWeek = body.targetMinutesPerWeek
    if (body.isActive !== undefined) updates.isActive = body.isActive

    if (Object.keys(updates).length === 0) {
      throw createApiError('No valid fields to update', 400)
    }

    const [goal] = await db.update(practiceGoals).set(updates).where(eq(practiceGoals.id, validId)).returning()

    if (!goal) {
      throw createApiError('Goal not found', 404)
    }

    return goal
  } catch (error) {
    return handleApiError(error, { route: '/api/goals/[id]', operation: 'update' })
  }
})
