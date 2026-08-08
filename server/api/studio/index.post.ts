import { eq } from 'drizzle-orm';
import { studios } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { applyRateLimit } from '../../utils/rate-limit';
import { createApiError, createConflictError, handleApiError } from '../../utils/errors';

export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'studio:create', 5);
    const user = await requireAuth(event);
    const db = useDb();
    const body = await readBody(event);

    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      throw createApiError('name is required', 400);
    }
    if (name.length > 80) {
      throw createApiError('name must be 80 characters or fewer', 400);
    }

    let weeklyTargetMinutes = 90;
    if (body.weeklyTargetMinutes !== undefined) {
      if (!Number.isInteger(body.weeklyTargetMinutes) || body.weeklyTargetMinutes < 1) {
        throw createApiError('weeklyTargetMinutes must be a positive integer', 400);
      }
      weeklyTargetMinutes = body.weeklyTargetMinutes;
    }

    const [existing] = await db
      .select()
      .from(studios)
      .where(eq(studios.ownerId, user.id))
      .limit(1);
    if (existing) {
      throw createConflictError('You already have a studio');
    }

    const [studio] = await db
      .insert(studios)
      .values({ ownerId: user.id, name, weeklyTargetMinutes })
      .returning();

    return studio;
  } catch (error) {
    return handleApiError(error, { route: '/api/studio', operation: 'create' });
  }
});
