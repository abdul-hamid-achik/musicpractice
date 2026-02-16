import bcrypt from 'bcrypt'
import { eq, or } from 'drizzle-orm'
import { users } from '../../db/schema'
import { createAuthToken, setAuthCookie } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const db = useDb()
  const body = await readBody(event)

  const { email, username, password, name } = body || {}

  // Validate required fields
  if (!email || !username || !password || !name) {
    throw createError({ statusCode: 400, message: 'email, username, password, and name are required' })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  // Validate username length
  if (username.length < 3 || username.length > 30) {
    throw createError({ statusCode: 400, message: 'Username must be between 3 and 30 characters' })
  }

  // Validate password length
  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  // Check if user already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.username, username)))
    .limit(1)

  if (existing) {
    throw createError({ statusCode: 409, message: 'A user with this email or username already exists' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [user] = await db.insert(users).values({
    email,
    username,
    passwordHash,
    name,
  }).returning()

  if (!user) throw createError({ statusCode: 500, message: 'Failed to create user' })

  const token = createAuthToken(user.id)
  setAuthCookie(event, token)

  const { passwordHash: _, ...safeUser } = user
  return safeUser
})
