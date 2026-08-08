import { sql } from 'drizzle-orm';
import { assignments, studioMembers } from '../../../db/schema';
import { requireAuth } from '../../../utils/auth';
import { requireOwnedStudio } from '../../../utils/studio';
import { applyRateLimit } from '../../../utils/rate-limit';
import { createApiError, handleApiError, validateId } from '../../../utils/errors';

export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'studio:assign', 30);
    const user = await requireAuth(event);
    const db = useDb();
    const studio = await requireOwnedStudio(db, user);
    const body = await readBody(event);

    const studentId = validateId(body?.studentId, 'studentId');
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) {
      throw createApiError('title is required', 400);
    }
    if (body.songId) {
      validateId(body.songId, 'songId');
    }

    const [membership] = await db
      .select()
      .from(studioMembers)
      .where(
        sql`${studioMembers.studioId} = ${studio.id} AND ${studioMembers.userId} = ${studentId}`,
      )
      .limit(1);
    if (!membership) {
      throw createApiError('That student is not in your studio', 403);
    }

    const [assignment] = await db
      .insert(assignments)
      .values({
        studioId: studio.id,
        studentId,
        songId: body.songId ?? null,
        title,
        notes: body.notes ?? null,
      })
      .returning();

    return assignment;
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/assignments', operation: 'create' });
  }
});
