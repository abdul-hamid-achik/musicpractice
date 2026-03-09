import { songs } from '../../db/schema'
import { createApiError, handleApiError } from '../../utils/errors'

const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const
const NOTATION_FORMATS = ['alphatex', 'musicxml', 'guitar_pro', 'vexflow_json'] as const

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const body = await readBody(event)

    if (!body.title || !body.difficulty || !body.instrumentType || !body.format || !body.notationData) {
      throw createApiError('title, difficulty, instrumentType, format, and notationData are required', 400)
    }

    if (!DIFFICULTIES.includes(body.difficulty)) {
      throw createApiError(`difficulty must be one of: ${DIFFICULTIES.join(', ')}`, 400)
    }
    if (!INSTRUMENT_TYPES.includes(body.instrumentType)) {
      throw createApiError(`instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}`, 400)
    }
    if (!NOTATION_FORMATS.includes(body.format)) {
      throw createApiError(`format must be one of: ${NOTATION_FORMATS.join(', ')}`, 400)
    }

    const [song] = await db.insert(songs).values({
      title: body.title,
      artist: body.artist ?? null,
      difficulty: body.difficulty,
      instrumentType: body.instrumentType,
      format: body.format,
      notationData: body.notationData,
      metadata: body.metadata ?? null,
    }).returning()

    return song
  } catch (error) {
    return handleApiError(error, { route: '/api/songs', operation: 'create' })
  }
})
