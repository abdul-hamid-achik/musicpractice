import { eq, and } from 'drizzle-orm'
import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'
import { createApiError, handleApiError, validateId } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const db = useDb()
    const id = getRouterParam(event, 'id')

    const validId = validateId(id, 'preset id')

    const body = await readBody(event)

    if (body.tempoBpm != null && (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1)) {
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

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.tempoBpm !== undefined) updates.tempoBpm = body.tempoBpm
    if (body.beatsPerMeasure !== undefined) updates.beatsPerMeasure = body.beatsPerMeasure
    if (body.beatUnit !== undefined) updates.beatUnit = body.beatUnit
    if (body.accentPattern !== undefined) updates.accentPattern = body.accentPattern
    if (body.subdivision !== undefined) updates.subdivision = body.subdivision

    if (Object.keys(updates).length === 0) {
      throw createApiError('No valid fields to update', 400)
    }

    const [preset] = await db.update(metronomePresets)
      .set(updates)
      .where(and(eq(metronomePresets.id, validId), eq(metronomePresets.userId, user.id)))
      .returning()

    if (!preset) {
      throw createApiError('Preset not found', 404)
    }

    return preset
  } catch (error) {
    return handleApiError(error, { route: '/api/metronome-presets/[id]', operation: 'update' })
  }
})
