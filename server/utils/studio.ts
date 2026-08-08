import { eq } from 'drizzle-orm';
import { studios } from '../db/schema';
import { createNotFoundError } from './errors';
import type { AuthUser } from './auth';

/**
 * Free-plan cap on students per studio. Enforced server-side at join
 * time; lifting it becomes the paid "Studio" plan when billing lands.
 */
export const FREE_STUDENT_LIMIT = 3;

export type Studio = typeof studios.$inferSelect;

/**
 * Resolve the studio owned by the given user, or 404 if they don't
 * have one. Used by every teacher-side endpoint.
 */
export async function requireOwnedStudio(
  db: ReturnType<typeof useDb>,
  user: AuthUser,
): Promise<Studio> {
  const [studio] = await db.select().from(studios).where(eq(studios.ownerId, user.id)).limit(1);
  if (!studio) {
    throw createNotFoundError('Studio');
  }
  return studio;
}
