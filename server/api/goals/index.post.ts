import { practiceGoals } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.userId || !body.title || !body.targetMinutesPerWeek) {
    throw createError({ statusCode: 400, message: 'userId, title, and targetMinutesPerWeek are required' })
  }

  const [goal] = await db.insert(practiceGoals).values({
    userId: body.userId,
    instrumentId: body.instrumentId ?? null,
    title: body.title,
    description: body.description ?? null,
    targetMinutesPerWeek: body.targetMinutesPerWeek,
  }).returning()

  return goal
})
