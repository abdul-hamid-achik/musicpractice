import { practiceGoals } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const body = await readBody(event)

  if (!body.userId || !body.title || !body.targetMinutesPerWeek) {
    throw createError({ statusCode: 400, message: 'userId, title, and targetMinutesPerWeek are required' })
  }

  if (!UUID_RE.test(body.userId)) {
    throw createError({ statusCode: 400, message: 'Invalid userId format' })
  }
  if (body.instrumentId && !UUID_RE.test(body.instrumentId)) {
    throw createError({ statusCode: 400, message: 'Invalid instrumentId format' })
  }
  if (!Number.isInteger(body.targetMinutesPerWeek) || body.targetMinutesPerWeek < 1) {
    throw createError({ statusCode: 400, message: 'targetMinutesPerWeek must be a positive integer' })
  }

  try {
    const [goal] = await db.insert(practiceGoals).values({
      userId: body.userId,
      instrumentId: body.instrumentId ?? null,
      title: body.title,
      description: body.description ?? null,
      targetMinutesPerWeek: body.targetMinutesPerWeek,
    }).returning()

    return goal
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to create goal' })
  }
})
