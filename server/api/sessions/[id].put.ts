import { eq } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'session id')

    const body = await readBody(event)

    if (body.durationSeconds != null && (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 0)) {
      throw createApiError('durationSeconds must be a non-negative integer', 400)
    }
    if (body.tempoBpm != null && (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1)) {
      throw createApiError('tempoBpm must be a positive integer', 400)
    }

    const updates: Record<string, unknown> = {}
    if (body.endedAt !== undefined) updates.endedAt = body.endedAt ? new Date(body.endedAt) : null
    if (body.durationSeconds !== undefined) updates.durationSeconds = body.durationSeconds
    if (body.tempoBpm !== undefined) updates.tempoBpm = body.tempoBpm
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.tags !== undefined) updates.tags = body.tags

    if (Object.keys(updates).length === 0) {
      throw createApiError('No valid fields to update', 400)
    }

    const [session] = await db.update(practiceSessions).set(updates).where(eq(practiceSessions.id, validId)).returning()

    if (!session) {
      throw createApiError('Session not found', 404)
    }

    return session
  } catch (error) {
    return handleApiError(error, { route: '/api/sessions/[id]', operation: 'update' })
  }
})
