import { eq } from 'drizzle-orm'
import { practiceSessions, users } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()
  const body = await readBody(event)

  if (!body.instrumentId || !body.startedAt) {
    throw createError({ statusCode: 400, message: 'instrumentId and startedAt are required' })
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
      userId: user.id,
      instrumentId: body.instrumentId,
      startedAt: new Date(body.startedAt),
      endedAt: body.endedAt ? new Date(body.endedAt) : null,
      durationSeconds: body.durationSeconds ?? null,
      tempoBpm: body.tempoBpm ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
    }).returning()

    if (!session) throw createError({ statusCode: 500, message: 'Failed to create session' })

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
        const today = new Date().toISOString().split('T')[0]!
        const lastDate = userRow.lastPracticeDate

        let newStreak = userRow.currentStreak

        if (lastDate === today) {
          // Already practiced today — keep streak as-is
        } else {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          if (lastDate === yesterdayStr) {
            // Practiced yesterday — continue streak
            newStreak = userRow.currentStreak + 1
          } else {
            // Missed a day or first session ever — reset to 1
            newStreak = 1
          }
        }

        const newLongest = Math.max(userRow.longestStreak, newStreak)

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

    return session
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to create session' })
  }
})
