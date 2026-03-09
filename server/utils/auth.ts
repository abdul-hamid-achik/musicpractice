import jwt, { type Jwt } from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import type { H3Event } from 'h3'

const JWT_SECRET = process.env.JWT_SECRET
const COOKIE_NAME = 'auth-token'

const DEFAULT_SECRET_WARNING = 'dev-secret-change-in-production'

function validateJwtSecret(): void {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.')
  }

  if (process.env.NODE_ENV === 'production' && JWT_SECRET === DEFAULT_SECRET_WARNING) {
    throw new Error('JWT_SECRET is set to the default value. Please set a strong, unique secret in production.')
  }

  if (JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters long for security.')
  }
}

// Validate JWT_SECRET on module load
validateJwtSecret()

interface JwtPayload {
  userId: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
  name: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

function stripPasswordHash(user: typeof users.$inferSelect): AuthUser {
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, JWT_SECRET!) as Jwt & JwtPayload
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
  if (!user) {
    throw createError({ statusCode: 401, message: 'User not found' })
  }

  return stripPasswordHash(user)
}

export async function getOptionalAuth(event: H3Event): Promise<AuthUser | null> {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null

  let payload: JwtPayload
  try {
    payload = jwt.verify(token, JWT_SECRET!) as Jwt & JwtPayload
  } catch {
    return null
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1)
  if (!user) return null

  return stripPasswordHash(user)
}

export function createAuthToken(userId: string): string {
  return jwt.sign({ userId } satisfies JwtPayload, JWT_SECRET!, { expiresIn: '7d' })
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
}
