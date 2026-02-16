import { songs } from '../../db/schema'

const INSTRUMENT_TYPES = ['guitar', 'bass', 'piano', 'violin'] as const
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const
const NOTATION_FORMATS = ['alphatex', 'musicxml', 'guitar_pro', 'vexflow_json'] as const

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.title || !body.difficulty || !body.instrumentType || !body.format || !body.notationData) {
    throw createError({ statusCode: 400, message: 'title, difficulty, instrumentType, format, and notationData are required' })
  }

  if (!DIFFICULTIES.includes(body.difficulty)) {
    throw createError({ statusCode: 400, message: `difficulty must be one of: ${DIFFICULTIES.join(', ')}` })
  }
  if (!INSTRUMENT_TYPES.includes(body.instrumentType)) {
    throw createError({ statusCode: 400, message: `instrumentType must be one of: ${INSTRUMENT_TYPES.join(', ')}` })
  }
  if (!NOTATION_FORMATS.includes(body.format)) {
    throw createError({ statusCode: 400, message: `format must be one of: ${NOTATION_FORMATS.join(', ')}` })
  }

  try {
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
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to create song' })
  }
})
