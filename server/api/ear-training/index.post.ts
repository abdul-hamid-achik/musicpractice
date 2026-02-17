import { earTrainingScores } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()
  const body = await readBody(event)

  if (!body.exerciseType || !['intervals', 'notes'].includes(body.exerciseType)) {
    throw createError({ statusCode: 400, message: 'exerciseType must be "intervals" or "notes"' })
  }
  if (!Number.isInteger(body.correct) || !Number.isInteger(body.total) || body.correct < 0 || body.total < 1) {
    throw createError({ statusCode: 400, message: 'correct and total must be valid integers' })
  }

  try {
    const [score] = await db.insert(earTrainingScores).values({
      userId: user.id,
      exerciseType: body.exerciseType,
      correct: body.correct,
      total: body.total,
      settings: body.settings ?? null,
    }).returning()

    return score
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to save score' })
  }
})
