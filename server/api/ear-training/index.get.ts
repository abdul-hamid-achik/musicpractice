import { eq, and, desc } from 'drizzle-orm'
import { earTrainingScores } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()
  const query = getQuery(event)

  const exerciseType = query.type as string | undefined
  const limit = Math.min(50, Math.max(1, parseInt(query.limit as string) || 20))

  try {
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
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch scores' })
  }
})
