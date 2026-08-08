import { desc, eq } from 'drizzle-orm';
import { assignments, studios } from '../../../db/schema';
import { requireAuth } from '../../../utils/auth';
import { handleApiError } from '../../../utils/errors';

/**
 * The caller's own assignments (student view), newest first, with the
 * studio name for context. Completed ones stay listed so students see
 * what they've finished this week.
 */
export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event);
    const db = useDb();

    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        notes: assignments.notes,
        songId: assignments.songId,
        completedAt: assignments.completedAt,
        createdAt: assignments.createdAt,
        studioName: studios.name,
      })
      .from(assignments)
      .innerJoin(studios, eq(assignments.studioId, studios.id))
      .where(eq(assignments.studentId, user.id))
      .orderBy(desc(assignments.createdAt));

    return rows;
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/assignments', operation: 'list' });
  }
});
