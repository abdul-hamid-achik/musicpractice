import { eq } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid session id is required' })
  }

  const body = await readBody(event)

  if (body.durationSeconds != null && (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 0)) {
    throw createError({ statusCode: 400, message: 'durationSeconds must be a non-negative integer' })
  }
  if (body.tempoBpm != null && (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1)) {
    throw createError({ statusCode: 400, message: 'tempoBpm must be a positive integer' })
  }

  try {
    const updates: Record<string, unknown> = {}
    if (body.endedAt !== undefined) updates.endedAt = body.endedAt ? new Date(body.endedAt) : null
    if (body.durationSeconds !== undefined) updates.durationSeconds = body.durationSeconds
    if (body.tempoBpm !== undefined) updates.tempoBpm = body.tempoBpm
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.tags !== undefined) updates.tags = body.tags

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'No valid fields to update' })
    }

    const [session] = await db.update(practiceSessions).set(updates).where(eq(practiceSessions.id, id)).returning()

    if (!session) {
      throw createError({ statusCode: 404, message: 'Session not found' })
    }

    return session
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to update session' })
  }
})
