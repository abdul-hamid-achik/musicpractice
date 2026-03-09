import { eq } from 'drizzle-orm'
import { userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'progress id')

    const body = await readBody(event)

    if (body.completionPercent != null && (typeof body.completionPercent !== 'number' || body.completionPercent < 0 || body.completionPercent > 100)) {
      throw createApiError('completionPercent must be a number between 0 and 100', 400)
    }
    if (body.maxTempoBpm != null && (!Number.isInteger(body.maxTempoBpm) || body.maxTempoBpm < 1)) {
      throw createApiError('maxTempoBpm must be a positive integer', 400)
    }
    if (body.practiceCount != null && (!Number.isInteger(body.practiceCount) || body.practiceCount < 0)) {
      throw createApiError('practiceCount must be a non-negative integer', 400)
    }

    const updates: Record<string, unknown> = {}
    if (body.completionPercent !== undefined) updates.completionPercent = body.completionPercent
    if (body.maxTempoBpm !== undefined) updates.maxTempoBpm = body.maxTempoBpm
    if (body.lastPracticedAt !== undefined) updates.lastPracticedAt = body.lastPracticedAt ? new Date(body.lastPracticedAt) : null
    if (body.practiceCount !== undefined) updates.practiceCount = body.practiceCount

    if (Object.keys(updates).length === 0) {
      throw createApiError('No valid fields to update', 400)
    }

    const [progress] = await db.update(userProgress).set(updates).where(eq(userProgress.id, validId)).returning()

    if (!progress) {
      throw createApiError('Progress not found', 404)
    }

    return progress
  } catch (error) {
    return handleApiError(error, { route: '/api/progress/[id]', operation: 'update' })
  }
})
