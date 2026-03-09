import { eq } from 'drizzle-orm'
import { practiceSessions, instruments } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'session id')

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
      .where(eq(practiceSessions.id, validId))

    if (!session) {
      throw createApiError('Session not found', 404)
    }

    return session
  } catch (error) {
    return handleApiError(error, { route: '/api/sessions/[id]', operation: 'get' })
  }
})
