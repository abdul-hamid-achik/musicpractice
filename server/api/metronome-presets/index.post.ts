import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const body = await readBody(event)

    if (!body.name || !body.tempoBpm) {
      throw createApiError('name and tempoBpm are required', 400)
    }

    if (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1) {
      throw createApiError('tempoBpm must be a positive integer', 400)
    }
    if (body.beatsPerMeasure != null && (!Number.isInteger(body.beatsPerMeasure) || body.beatsPerMeasure < 1)) {
      throw createApiError('beatsPerMeasure must be a positive integer', 400)
    }
    if (body.beatUnit != null && (!Number.isInteger(body.beatUnit) || body.beatUnit < 1)) {
      throw createApiError('beatUnit must be a positive integer', 400)
    }
    if (body.subdivision != null && (!Number.isInteger(body.subdivision) || body.subdivision < 1)) {
      throw createApiError('subdivision must be a positive integer', 400)
    }

    const [preset] = await db.insert(metronomePresets).values({
      userId: user.id,
      name: body.name,
      tempoBpm: body.tempoBpm,
      beatsPerMeasure: body.beatsPerMeasure ?? 4,
      beatUnit: body.beatUnit ?? 4,
      accentPattern: body.accentPattern ?? null,
      subdivision: body.subdivision ?? 1,
    }).returning()

    return preset
  } catch (error) {
    return handleApiError(error, { route: '/api/metronome-presets', operation: 'create' })
  }
})
