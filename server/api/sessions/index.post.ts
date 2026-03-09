import { eq, and } from 'drizzle-orm'
import { practiceSessions, users, userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { calculateStreakUpdate } from '../../utils/streaks'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const body = await readBody(event)

    if (!body.instrumentId || !body.startedAt) {
      throw createApiError('instrumentId and startedAt are required', 400)
    }

    validateId(body.instrumentId, 'instrumentId')
    if (body.songId != null) {
      validateId(body.songId, 'songId')
    }
    if (body.durationSeconds != null && (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 0)) {
      throw createApiError('durationSeconds must be a non-negative integer', 400)
    }
    if (body.tempoBpm != null && (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1)) {
      throw createApiError('tempoBpm must be a positive integer', 400)
    }

    const [session] = await db.insert(practiceSessions).values({
      userId: user.id,
      instrumentId: body.instrumentId,
      songId: body.songId ?? null,
      startedAt: new Date(body.startedAt),
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      durationSeconds: body.durationSeconds ?? null,
      tempoBpm: body.tempoBpm ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
    }).returning()

    if (!session) {
      throw createApiError('Failed to create session', 500)
    }

    // Update streak
    try {
      const [userRow] = await db
        .select({
          currentStreak: users.currentStreak,
          longestStreak: users.longestStreak,
          lastPracticeDate: users.lastPracticeDate,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)

      if (userRow) {
        const { currentStreak: newStreak, longestStreak: newLongest, today } = calculateStreakUpdate(
          userRow.lastPracticeDate,
          userRow.currentStreak,
          userRow.longestStreak
        )

        await db
          .update(users)
          .set({
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastPracticeDate: today,
          })
          .where(eq(users.id, user.id))
      }
    } catch {
      // Streak update is non-critical — don't fail the session save
    }

    // Update song progress if a song was practiced
    if (body.songId) {
      try {
        const existing = await db
          .select()
          .from(userProgress)
          .where(and(eq(userProgress.userId, user.id), eq(userProgress.songId, body.songId)))
          .limit(1)

        // Calculate completion percent based on session duration (5% per 5 minutes, capped at 100%)
        let completionIncrement = 0
        if (body.durationSeconds != null && body.durationSeconds > 0) {
          const durationMinutes = body.durationSeconds / 60
          completionIncrement = Math.min(100, Math.floor(durationMinutes / 5) * 5)
        }

        if (existing.length > 0) {
          const row = existing[0]!
          const newCompletionPercent = Math.min(100, (row.completionPercent ?? 0) + completionIncrement)

          await db
            .update(userProgress)
            .set({
              practiceCount: row.practiceCount + 1,
              lastPracticedAt: new Date(),
              maxTempoBpm: body.tempoBpm && (!row.maxTempoBpm || body.tempoBpm > row.maxTempoBpm)
                ? body.tempoBpm
                : row.maxTempoBpm,
              completionPercent: newCompletionPercent,
            })
            .where(eq(userProgress.id, row.id))
        } else {
          await db.insert(userProgress).values({
            userId: user.id,
            songId: body.songId,
            practiceCount: 1,
            lastPracticedAt: new Date(),
            maxTempoBpm: body.tempoBpm ?? null,
            completionPercent: completionIncrement,
          })
        }
      } catch {
        // Song progress update is non-critical
      }
    }

    return session
  } catch (error) {
    return handleApiError(error, { route: '/api/sessions', operation: 'create' })
  }
})
