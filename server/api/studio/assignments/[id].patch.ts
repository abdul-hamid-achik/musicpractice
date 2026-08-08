import { eq } from 'drizzle-orm';
import { assignments, studios } from '../../../db/schema';
import { requireAuth } from '../../../utils/auth';
import { applyRateLimit } from '../../../utils/rate-limit';
import {
  createApiError,
  createNotFoundError,
  handleApiError,
  validateId,
} from '../../../utils/errors';

/**
 * Toggle completion. The assigned student or the studio's teacher can
 * mark an assignment done (or undo it).
 */
export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'studio:assignment-update', 30);
    const user = await requireAuth(event);
    const db = useDb();
    const id = validateId(getRouterParam(event, 'id'));
    const body = await readBody(event);

    if (typeof body?.completed !== 'boolean') {
      throw createApiError('completed (boolean) is required', 400);
    }

    const [row] = await db
      .select({
        id: assignments.id,
        studentId: assignments.studentId,
        ownerId: studios.ownerId,
      })
      .from(assignments)
      .innerJoin(studios, eq(assignments.studioId, studios.id))
      .where(eq(assignments.id, id))
      .limit(1);
    if (!row) {
      throw createNotFoundError('Assignment');
    }
    if (row.studentId !== user.id && row.ownerId !== user.id) {
      throw createApiError('Access denied', 403);
    }

    const [updated] = await db
      .update(assignments)
      .set({ completedAt: body.completed ? new Date() : null })
      .where(eq(assignments.id, id))
      .returning();

    return updated;
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/assignments/:id', operation: 'update' });
  }
});
