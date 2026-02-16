import { songs } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  if (!body.title || !body.difficulty || !body.instrumentType || !body.format || !body.notationData) {
    throw createError({ statusCode: 400, message: 'title, difficulty, instrumentType, format, and notationData are required' })
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
})
