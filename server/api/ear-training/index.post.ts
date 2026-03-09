import { earTrainingScores } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const body = await readBody(event)

    if (!body.exerciseType || !['intervals', 'notes'].includes(body.exerciseType)) {
      throw createApiError('exerciseType must be "intervals" or "notes"', 400)
    }
    if (!Number.isInteger(body.correct) || !Number.isInteger(body.total) || body.correct < 0 || body.total < 1) {
      throw createApiError('correct and total must be valid integers', 400)
    }

    const [score] = await db.insert(earTrainingScores).values({
      userId: user.id,
      exerciseType: body.exerciseType,
      correct: body.correct,
      total: body.total,
      settings: body.settings ?? null,
    }).returning()

    return score
  } catch (error) {
    return handleApiError(error, { route: '/api/ear-training', operation: 'create' })
  }
})
