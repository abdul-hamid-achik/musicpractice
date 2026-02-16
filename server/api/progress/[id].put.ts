import { eq } from 'drizzle-orm'
import { userProgress } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid progress id is required' })
  }

  const body = await readBody(event)

  if (body.completionPercent != null && (typeof body.completionPercent !== 'number' || body.completionPercent < 0 || body.completionPercent > 100)) {
    throw createError({ statusCode: 400, message: 'completionPercent must be a number between 0 and 100' })
  }
  if (body.maxTempoBpm != null && (!Number.isInteger(body.maxTempoBpm) || body.maxTempoBpm < 1)) {
    throw createError({ statusCode: 400, message: 'maxTempoBpm must be a positive integer' })
  }
  if (body.practiceCount != null && (!Number.isInteger(body.practiceCount) || body.practiceCount < 0)) {
    throw createError({ statusCode: 400, message: 'practiceCount must be a non-negative integer' })
  }

  try {
    const updates: Record<string, unknown> = {}
    if (body.completionPercent !== undefined) updates.completionPercent = body.completionPercent
    if (body.maxTempoBpm !== undefined) updates.maxTempoBpm = body.maxTempoBpm
    if (body.lastPracticedAt !== undefined) updates.lastPracticedAt = body.lastPracticedAt ? new Date(body.lastPracticedAt) : null
    if (body.practiceCount !== undefined) updates.practiceCount = body.practiceCount

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'No valid fields to update' })
    }

    const [progress] = await db.update(userProgress).set(updates).where(eq(userProgress.id, id)).returning()

    if (!progress) {
      throw createError({ statusCode: 404, message: 'Progress not found' })
    }

    return progress
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to update progress' })
  }
})
