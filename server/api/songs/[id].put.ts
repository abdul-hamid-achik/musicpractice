import { eq } from 'drizzle-orm'
import { songs } from '../../db/schema'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const
const NOTATION_FORMATS = ['alphatex', 'musicxml', 'guitar_pro', 'vexflow_json'] as const

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'song id')

    const body = await readBody(event)

    if (body.difficulty !== undefined && !DIFFICULTIES.includes(body.difficulty)) {
      throw createApiError(`difficulty must be one of: ${DIFFICULTIES.join(', ')}`, 400)
    }
    if (body.instrumentType !== undefined && !INSTRUMENT_TYPES.includes(body.instrumentType)) {
      throw createApiError(`instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}`, 400)
    }
    if (body.format !== undefined && !NOTATION_FORMATS.includes(body.format)) {
      throw createApiError(`format must be one of: ${NOTATION_FORMATS.join(', ')}`, 400)
    }

    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.artist !== undefined) updates.artist = body.artist
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty
    if (body.instrumentType !== undefined) updates.instrumentType = body.instrumentType
    if (body.format !== undefined) updates.format = body.format
    if (body.notationData !== undefined) updates.notationData = body.notationData
    if (body.metadata !== undefined) updates.metadata = body.metadata

    if (Object.keys(updates).length === 0) {
      throw createApiError('No valid fields to update', 400)
    }

    const [song] = await db.update(songs).set(updates).where(eq(songs.id, validId)).returning()

    if (!song) {
      throw createApiError('Song not found', 404)
    }

    return song
  } catch (error) {
    return handleApiError(error, { route: '/api/songs/[id]', operation: 'update' })
  }
})
