import { eq } from 'drizzle-orm';
import { practiceSessions } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { applyRateLimit } from '../../utils/rate-limit';
import { createApiError, handleApiError, validateId } from '../../utils/errors';

export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'sessions:delete', 10);
    const user = await requireAuth(event);
    const db = useDb();
    const id = getRouterParam(event, 'id');

    const validId = validateId(id, 'session id');

    const [existing] = await db
      .select({ userId: practiceSessions.userId })
      .from(practiceSessions)
      .where(eq(practiceSessions.id, validId));

    if (!existing) {
      throw createApiError('Session not found', 404);
    }
    if (existing.userId !== user.id) {
      throw createApiError('You do not have permission to delete this session', 403);
    }

    const [deleted] = await db
      .delete(practiceSessions)
      .where(eq(practiceSessions.id, validId))
      .returning();

    if (!deleted) {
      throw createApiError('Session not found', 404);
    }

    return { message: 'Session deleted', id: deleted.id };
  } catch (error) {
    return handleApiError(error, { route: '/api/sessions/[id]', operation: 'delete' });
  }
});
