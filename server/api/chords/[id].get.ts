import { eq } from 'drizzle-orm'
import { chords } from '../../db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid chord id is required' })
  }

  try {
    const [chord] = await db.select().from(chords).where(eq(chords.id, id))

    if (!chord) {
      throw createError({ statusCode: 404, message: 'Chord not found' })
    }

    return chord
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to fetch chord' })
  }
})
