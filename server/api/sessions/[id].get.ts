import { eq } from 'drizzle-orm'
import { practiceSessions, instruments } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid session id is required' })
  }

  try {
    const [session] = await db
      .select({
        id: practiceSessions.id,
        userId: practiceSessions.userId,
        instrumentId: practiceSessions.instrumentId,
        instrumentName: instruments.name,
        startedAt: practiceSessions.startedAt,
        endedAt: practiceSessions.endedAt,
        durationSeconds: practiceSessions.durationSeconds,
        tempoBpm: practiceSessions.tempoBpm,
        notes: practiceSessions.notes,
        tags: practiceSessions.tags,
        createdAt: practiceSessions.createdAt,
      })
      .from(practiceSessions)
      .leftJoin(instruments, eq(practiceSessions.instrumentId, instruments.id))
      .where(eq(practiceSessions.id, id))

    if (!session) {
      throw createError({ statusCode: 404, message: 'Session not found' })
    }

    return session
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch session' })
  }
})
