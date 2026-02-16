import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const body = await readBody(event)

  if (!body.userId || !body.name || !body.tempoBpm) {
    throw createError({ statusCode: 400, message: 'userId, name, and tempoBpm are required' })
  }

  if (!UUID_RE.test(body.userId)) {
    throw createError({ statusCode: 400, message: 'Invalid userId format' })
  }
  if (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1) {
    throw createError({ statusCode: 400, message: 'tempoBpm must be a positive integer' })
  }
  if (body.beatsPerMeasure != null && (!Number.isInteger(body.beatsPerMeasure) || body.beatsPerMeasure < 1)) {
    throw createError({ statusCode: 400, message: 'beatsPerMeasure must be a positive integer' })
  }
  if (body.beatUnit != null && (!Number.isInteger(body.beatUnit) || body.beatUnit < 1)) {
    throw createError({ statusCode: 400, message: 'beatUnit must be a positive integer' })
  }
  if (body.subdivision != null && (!Number.isInteger(body.subdivision) || body.subdivision < 1)) {
    throw createError({ statusCode: 400, message: 'subdivision must be a positive integer' })
  }

  try {
    const [preset] = await db.insert(metronomePresets).values({
      userId: body.userId,
      name: body.name,
      tempoBpm: body.tempoBpm,
      beatsPerMeasure: body.beatsPerMeasure ?? 4,
      beatUnit: body.beatUnit ?? 4,
      accentPattern: body.accentPattern ?? null,
      subdivision: body.subdivision ?? 1,
    }).returning()

    return preset
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to create metronome preset' })
  }
})
