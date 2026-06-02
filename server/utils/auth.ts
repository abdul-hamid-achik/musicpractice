import jwt, { type Jwt } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { env } from './env';
import type { H3Event } from 'h3';

// JWT_SECRET / NODE_ENV validation is performed in `server/utils/env.ts`,
// which is imported transitively via `./env` above. Importing this module
// will throw in production if the secret is missing, too short, or matches
// the well-known development default from `.env.example`.
const JWT_SECRET = env.JWT_SECRET;
const COOKIE_NAME = 'auth-token';
const isProduction = env.isProduction;

interface JwtPayload {
  userId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function stripPasswordHash(user: typeof users.$inferSelect): AuthUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentication required' });
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET!) as Jwt & JwtPayload;
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) {
    throw createError({ statusCode: 401, message: 'User not found' });
  }

  return stripPasswordHash(user);
}

export async function getOptionalAuth(event: H3Event): Promise<AuthUser | null> {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET!) as Jwt & JwtPayload;
  } catch {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) return null;

  return stripPasswordHash(user);
}

export function createAuthToken(userId: string): string {
  return jwt.sign({ userId } satisfies JwtPayload, JWT_SECRET!, { expiresIn: '7d' });
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
