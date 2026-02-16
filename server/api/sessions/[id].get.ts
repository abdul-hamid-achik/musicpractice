import { eq } from 'drizzle-orm'
import { practiceSessions } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Session id is required' })
  }

  const [session] = await db.select().from(practiceSessions).where(eq(practiceSessions.id, id))

  if (!session) {
    throw createError({ statusCode: 404, message: 'Session not found' })
  }

  return session
})
