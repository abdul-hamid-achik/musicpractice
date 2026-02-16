import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const
const NOTATION_FORMATS = ['alphatex', 'musicxml', 'guitar_pro', 'vexflow_json'] as const

export default defineEventHandler(async (event) => {
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid song id is required' })
  }

  const body = await readBody(event)

  if (body.difficulty !== undefined && !DIFFICULTIES.includes(body.difficulty)) {
    throw createError({ statusCode: 400, message: `difficulty must be one of: ${DIFFICULTIES.join(', ')}` })
  }
  if (body.instrumentType !== undefined && !INSTRUMENT_TYPES.includes(body.instrumentType)) {
    throw createError({ statusCode: 400, message: `instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}` })
  }
  if (body.format !== undefined && !NOTATION_FORMATS.includes(body.format)) {
    throw createError({ statusCode: 400, message: `format must be one of: ${NOTATION_FORMATS.join(', ')}` })
  }

  try {
    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.artist !== undefined) updates.artist = body.artist
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty
    if (body.instrumentType !== undefined) updates.instrumentType = body.instrumentType
    if (body.format !== undefined) updates.format = body.format
    if (body.notationData !== undefined) updates.notationData = body.notationData
    if (body.metadata !== undefined) updates.metadata = body.metadata

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'No valid fields to update' })
    }

    const [song] = await db.update(songs).set(updates).where(eq(songs.id, id)).returning()

    if (!song) {
      throw createError({ statusCode: 404, message: 'Song not found' })
    }

    return song
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to update song' })
  }
})
