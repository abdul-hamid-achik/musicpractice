import { userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const body = await readBody(event)

  if (!body.userId || !body.songId) {
    throw createError({ statusCode: 400, message: 'userId and songId are required' })
  }

  if (!UUID_RE.test(body.userId)) {
    throw createError({ statusCode: 400, message: 'Invalid userId format' })
  }
  if (!UUID_RE.test(body.songId)) {
    throw createError({ statusCode: 400, message: 'Invalid songId format' })
  }
  if (body.completionPercent != null && (typeof body.completionPercent !== 'number' || body.completionPercent < 0 || body.completionPercent > 100)) {
    throw createError({ statusCode: 400, message: 'completionPercent must be a number between 0 and 100' })
  }
  if (body.maxTempoBpm != null && (!Number.isInteger(body.maxTempoBpm) || body.maxTempoBpm < 1)) {
    throw createError({ statusCode: 400, message: 'maxTempoBpm must be a positive integer' })
  }
  if (body.practiceCount != null && (!Number.isInteger(body.practiceCount) || body.practiceCount < 0)) {
    throw createError({ statusCode: 400, message: 'practiceCount must be a non-negative integer' })
  }

  try {
    const [progress] = await db.insert(userProgress).values({
      userId: body.userId,
      songId: body.songId,
      completionPercent: body.completionPercent ?? 0,
      maxTempoBpm: body.maxTempoBpm ?? null,
      lastPracticedAt: body.lastPracticedAt ? new Date(body.lastPracticedAt) : null,
      practiceCount: body.practiceCount ?? 0,
    }).returning()

    return progress
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to create progress' })
  }
})
