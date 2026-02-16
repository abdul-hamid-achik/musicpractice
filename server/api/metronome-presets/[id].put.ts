import { eq } from 'drizzle-orm'
import { metronomePresets } from '../../db/schema'
import { requireAuth } from '../../utils/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const db = useDb()
  const id = getRouterParam(event, 'id')

  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, message: 'Valid preset id is required' })
  }

  const body = await readBody(event)

  if (body.tempoBpm != null && (!Number.isInteger(body.tempoBpm) || body.tempoBpm < 1)) {
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
    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.tempoBpm !== undefined) updates.tempoBpm = body.tempoBpm
    if (body.beatsPerMeasure !== undefined) updates.beatsPerMeasure = body.beatsPerMeasure
    if (body.beatUnit !== undefined) updates.beatUnit = body.beatUnit
    if (body.accentPattern !== undefined) updates.accentPattern = body.accentPattern
    if (body.subdivision !== undefined) updates.subdivision = body.subdivision

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'No valid fields to update' })
    }

    const [preset] = await db.update(metronomePresets).set(updates).where(eq(metronomePresets.id, id)).returning()

    if (!preset) {
      throw createError({ statusCode: 404, message: 'Preset not found' })
    }

    return preset
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    throw createError({ statusCode: 500, message: 'Failed to update metronome preset' })
  }
})
