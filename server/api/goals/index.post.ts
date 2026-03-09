import { practiceGoals } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const body = await readBody(event)

    if (!body.title || !body.targetMinutesPerWeek) {
      throw createApiError('title and targetMinutesPerWeek are required', 400)
    }

    if (body.instrumentId) {
      validateId(body.instrumentId, 'instrumentId')
    }
    if (!Number.isInteger(body.targetMinutesPerWeek) || body.targetMinutesPerWeek < 1) {
      throw createApiError('targetMinutesPerWeek must be a positive integer', 400)
    }

    const [goal] = await db.insert(practiceGoals).values({
      userId: user.id,
      instrumentId: body.instrumentId ?? null,
      title: body.title,
      description: body.description ?? null,
      targetMinutesPerWeek: body.targetMinutesPerWeek,
    }).returning()

    return goal
  } catch (error) {
    return handleApiError(error, { route: '/api/goals', operation: 'create' })
  }
})
