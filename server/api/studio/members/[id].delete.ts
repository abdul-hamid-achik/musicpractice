import { sql } from 'drizzle-orm';
import { studioMembers } from '../../../db/schema';
import { requireAuth } from '../../../utils/auth';
import { requireOwnedStudio } from '../../../utils/studio';
import { applyRateLimit } from '../../../utils/rate-limit';
import { createNotFoundError, handleApiError, validateId } from '../../../utils/errors';

/**
 * Remove a student from the caller's studio. The student's account and
 * practice data are untouched — only the membership goes away.
 */
export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'studio:remove-member', 10);
    const user = await requireAuth(event);
    const db = useDb();
    const studio = await requireOwnedStudio(db, user);
    const memberUserId = validateId(getRouterParam(event, 'id'));

    const deleted = await db
      .delete(studioMembers)
      .where(
        sql`${studioMembers.studioId} = ${studio.id} AND ${studioMembers.userId} = ${memberUserId}`,
      )
      .returning();
    if (deleted.length === 0) {
      throw createNotFoundError('Student');
    }

    return { removed: true };
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/members/:id', operation: 'remove' });
  }
});
