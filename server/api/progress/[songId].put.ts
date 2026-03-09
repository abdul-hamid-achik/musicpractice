import { eq, and } from 'drizzle-orm'
import { userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const body = await readBody(event)
    const songId = event.context.params?.songId

    if (!songId) {
      throw createApiError('songId is required', 400)
    }

    validateId(songId, 'songId')

    // Validate optional fields
    if (body.completionPercent != null && (typeof body.completionPercent !== 'number' || body.completionPercent < 0 || body.completionPercent > 100)) {
      throw createApiError('completionPercent must be a number between 0 and 100', 400)
    }
    if (body.maxTempoBpm != null && (!Number.isInteger(body.maxTempoBpm) || body.maxTempoBpm < 1)) {
      throw createApiError('maxTempoBpm must be a positive integer', 400)
    }
    if (body.practiceCount != null && (!Number.isInteger(body.practiceCount) || body.practiceCount < 0)) {
      throw createApiError('practiceCount must be a non-negative integer', 400)
    }
    if (body.lastPracticedAt != null) {
      const date = new Date(body.lastPracticedAt)
      if (isNaN(date.getTime())) {
        throw createApiError('lastPracticedAt must be a valid date', 400)
      }
    }

    // Check if progress exists for this user and song
    const existing = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, user.id), eq(userProgress.songId, songId)))
      .limit(1)

    if (existing.length === 0) {
      // Create new progress entry if it doesn't exist
      const [progress] = await db.insert(userProgress).values({
        userId: user.id,
        songId,
        completionPercent: body.completionPercent ?? 0,
        maxTempoBpm: body.maxTempoBpm ?? null,
        lastPracticedAt: body.lastPracticedAt ? new Date(body.lastPracticedAt) : null,
        practiceCount: body.practiceCount ?? 0,
      }).returning()

      return progress
    }

    // Update existing progress
    const updateData: Record<string, unknown> = {}
    if (body.completionPercent != null) updateData.completionPercent = body.completionPercent
    if (body.maxTempoBpm != null) updateData.maxTempoBpm = body.maxTempoBpm
    if (body.lastPracticedAt != null) updateData.lastPracticedAt = new Date(body.lastPracticedAt)
    if (body.practiceCount != null) updateData.practiceCount = body.practiceCount

    const [updated] = await db
      .update(userProgress)
      .set(updateData)
      .where(and(eq(userProgress.userId, user.id), eq(userProgress.songId, songId)))
      .returning()

    return updated
  } catch (error) {
    return handleApiError(error, { route: '/api/progress/[songId]', operation: 'upsert' })
  }
})
