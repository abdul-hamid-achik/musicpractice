import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const body = await readBody(event)

  if (!body.userId || !body.instrumentId || !body.startedAt) {
    throw createError({ statusCode: 400, message: 'userId, instrumentId, and startedAt are required' })
  }

  if (!UUID_RE.test(body.userId)) {
    throw createError({ statusCode: 400, message: 'Invalid userId format' })
  }
  if (!UUID_RE.test(body.instrumentId)) {
    throw createError({ statusCode: 400, message: 'Invalid instrumentId format' })
  }
  if (body.durationSeconds != null && (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 0)) {
    throw createError({ statusCode: 400, message: 'durationSeconds must be a non-negative integer' })
  }
  if (body.tempoBpm != null && (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1)) {
    throw createError({ statusCode: 400, message: 'tempoBpm must be a positive integer' })
  }

  try {
    const [session] = await db.insert(practiceSessions).values({
      userId: body.userId,
      instrumentId: body.instrumentId,
      startedAt: new Date(body.startedAt),
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      durationSeconds: body.durationSeconds ?? null,
      tempoBpm: body.tempoBpm ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
    }).returning()

    if (!session) throw createError({ statusCode: 500, message: 'Failed to create session' })

    return session
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to create session' })
  }
})
