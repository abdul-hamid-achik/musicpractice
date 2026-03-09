import { eq, and, desc } from 'drizzle-orm'
import { earTrainingScores } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const query = getQuery(event)

    const exerciseType = query.type as string | undefined
    const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 20))

    const conditions = [eq(earTrainingScores.userId, user.id)]
    if (exerciseType && ['intervals', 'notes'].includes(exerciseType)) {
      conditions.push(eq(earTrainingScores.exerciseType, exerciseType))
    }

    const data = await db
      .select()
      .from(earTrainingScores)
      .where(and(...conditions))
      .orderBy(desc(earTrainingScores.createdAt))
      .limit(limit)

    return { data }
  } catch (error) {
    return handleApiError(error, { route: '/api/ear-training', operation: 'list' })
  }
})
