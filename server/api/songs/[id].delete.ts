import { eq } from 'drizzle-orm';
import { songs } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { applyRateLimit } from '../../utils/rate-limit';
import { createApiError, handleApiError, validateId } from '../../utils/errors';

export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'songs:delete', 5);
    await requireAuth(event);
    const db = useDb();
    const id = getRouterParam(event, 'id');

    const validId = validateId(id, 'song id');

    const [deleted] = await db.delete(songs).where(eq(songs.id, validId)).returning();

    if (!deleted) {
      throw createApiError('Song not found', 404);
    }

    return { message: 'Song deleted', id: deleted.id };
  } catch (error) {
    return handleApiError(error, { route: '/api/songs/[id]', operation: 'delete' });
  }
});
