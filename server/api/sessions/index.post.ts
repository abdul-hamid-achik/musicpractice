import { practiceSessions } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.userId || !body.instrumentId || !body.startedAt) {
    throw createError({ statusCode: 400, message: 'userId, instrumentId, and startedAt are required' })
  }

  const [session] = await db.insert(practiceSessions).values({
    userId: body.userId,
    instrumentId: body.instrumentId,
    startedAt: new Date(body.startedAt),
    endedAt: body.endedAt ? new Date(body.endedAt) : null,
    durationSeconds: body.durationSeconds ?? null,
    tempoBpm: body.tempoBpm ?? null,
    notes: body.notes ?? null,
    tags: body.tags ?? [],
  }).returning()

  return session
})
