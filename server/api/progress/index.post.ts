import { userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const body = await readBody(event)

    if (!body.songId) {
      throw createApiError('songId is required', 400)
    }

    validateId(body.songId, 'songId')
    if (body.completionPercent != null && (typeof body.completionPercent !== 'number' || body.completionPercent < 0 || body.completionPercent > 100)) {
      throw createApiError('completionPercent must be a number between 0 and 100', 400)
    }
    if (body.maxTempoBpm != null && (!Number.isInteger(body.maxTempoBpm) || body.maxTempoBpm < 1)) {
      throw createApiError('maxTempoBpm must be a positive integer', 400)
    }
    if (body.practiceCount != null && (!Number.isInteger(body.practiceCount) || body.practiceCount < 0)) {
      throw createApiError('practiceCount must be a non-negative integer', 400)
    }

    const [progress] = await db.insert(userProgress).values({
      userId: user.id,
      songId: body.songId,
      completionPercent: body.completionPercent ?? 0,
      maxTempoBpm: body.maxTempoBpm ?? null,
      lastPracticedAt: body.lastPracticedAt ? new Date(body.lastPracticedAt) : null,
      practiceCount: body.practiceCount ?? 0,
    }).returning()

    return progress
  } catch (error) {
    return handleApiError(error, { route: '/api/progress', operation: 'create' })
  }
})
