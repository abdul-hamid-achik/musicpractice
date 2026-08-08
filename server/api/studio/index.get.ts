import { eq, sql } from 'drizzle-orm';
import { studios, studioMembers } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { handleApiError } from '../../utils/errors';

/**
 * The caller's studio context, from either side of the relationship:
 *  - role 'teacher'  — the studio they own, with member count
 *  - role 'student'  — the studio they belong to
 *  - role null       — no studio yet
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const db = useDb();

    const [owned] = await db.select().from(studios).where(eq(studios.ownerId, user.id)).limit(1);
    if (owned) {
      const [count] = await db
        .select({ memberCount: sql<number>`COUNT(*)` })
        .from(studioMembers)
        .where(eq(studioMembers.studioId, owned.id));
      return { role: 'teacher', studio: owned, memberCount: Number(count?.memberCount ?? 0) };
    }

    const [membership] = await db
      .select({
        id: studios.id,
        name: studios.name,
        weeklyTargetMinutes: studios.weeklyTargetMinutes,
        joinedAt: studioMembers.joinedAt,
      })
      .from(studioMembers)
      .innerJoin(studios, eq(studioMembers.studioId, studios.id))
      .where(eq(studioMembers.userId, user.id))
      .limit(1);
    if (membership) {
      return { role: 'student', studio: membership, memberCount: null };
    }

    return { role: null, studio: null, memberCount: null };
  } catch (error) {
    return handleApiError(error, { route: '/api/studio', operation: 'get' });
  }
});
