import bcrypt from 'bcrypt'
import { eq, or } from 'drizzle-orm'
import { users } from '../../db/schema'
import { createAuthToken, setAuthCookie } from '../../utils/auth'
import { createApiError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const body = await readBody(event)

    const { identifier, password } = body || {}

    if (!identifier || !password) {
      throw createApiError('identifier and password are required', 400)
    }

    // Look up by email or username
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1)

    if (!user) {
      throw createApiError('Invalid credentials', 401)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw createApiError('Invalid credentials', 401)
    }

    const token = createAuthToken(user.id)
    setAuthCookie(event, token)

    const { passwordHash: _, ...safeUser } = user
    return safeUser
  } catch (error) {
    return handleApiError(error, { route: '/api/auth/login' })
  }
})
