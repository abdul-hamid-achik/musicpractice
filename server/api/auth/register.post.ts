import bcrypt from 'bcrypt'
import { eq, or } from 'drizzle-orm'
import { users } from '../../db/schema'
import { createAuthToken, setAuthCookie } from '../../utils/auth'
import { createApiError, handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const db = useDb()
    const body = await readBody(event)

    const { email, username, password, name } = body || {}

    // Validate required fields
    if (!email || !username || !password || !name) {
      throw createApiError('email, username, password, and name are required', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createApiError('Invalid email format', 400)
    }

    // Validate username length
    if (username.length < 3 || username.length > 30) {
      throw createApiError('Username must be between 3 and 30 characters', 400)
    }

    // Validate password length
    if (password.length < 8) {
      throw createApiError('Password must be at least 8 characters', 400)
    }

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1)

    if (existing) {
      throw createApiError('A user with this email or username already exists', 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const [user] = await db.insert(users).values({
      email,
      username,
      passwordHash,
      name,
    }).returning()

    if (!user) {
      throw createApiError('Failed to create user', 500)
    }

    const token = createAuthToken(user.id)
    setAuthCookie(event, token)

    const { passwordHash: _, ...safeUser } = user
    return safeUser
  } catch (error) {
    return handleApiError(error, { route: '/api/auth/register' })
  }
})
