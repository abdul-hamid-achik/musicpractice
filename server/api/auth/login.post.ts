import bcrypt from 'bcrypt'
import { eq, or } from 'drizzle-orm'
import { users } from '../../db/schema'
import { createAuthToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const { identifier, password } = body || {}

  if (!identifier || !password) {
    throw createError({ statusCode: 400, message: 'identifier and password are required' })
  }

  // Look up by email or username
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const token = createAuthToken(user.id)
  setAuthCookie(event, token)

  const { passwordHash: _, ...safeUser } = user
  return safeUser
})
