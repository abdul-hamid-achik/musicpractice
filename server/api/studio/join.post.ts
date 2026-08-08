import { eq, sql } from 'drizzle-orm';
import { studios, studioInvites, studioMembers } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { FREE_STUDENT_LIMIT } from '../../utils/studio';
import { applyRateLimit } from '../../utils/rate-limit';
import {
  createApiError,
  createConflictError,
  createForbiddenError,
  handleApiError,
} from '../../utils/errors';

export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'studio:join', 10);
    const user = await requireAuth(event);
    const db = useDb();
    const body = await readBody(event);

    const token = typeof body?.token === 'string' ? body.token : '';
    if (!token) {
      throw createApiError('token is required', 400);
    }

    const [invite] = await db
      .select()
      .from(studioInvites)
      .where(eq(studioInvites.token, token))
      .limit(1);
    if (!invite || invite.revoked || invite.expiresAt.getTime() < Date.now()) {
      throw createApiError('This invite link is no longer valid — ask your teacher for a new one', 410);
    }

    const [studio] = await db
      .select()
      .from(studios)
      .where(eq(studios.id, invite.studioId))
      .limit(1);
    if (!studio) {
      throw createApiError('This invite link is no longer valid — ask your teacher for a new one', 410);
    }
    if (studio.ownerId === user.id) {
      throw createApiError('You are the teacher of this studio', 400);
    }

    const [existing] = await db
      .select()
      .from(studioMembers)
      .where(
        sql`${studioMembers.studioId} = ${studio.id} AND ${studioMembers.userId} = ${user.id}`,
      )
      .limit(1);
    if (existing) {
      throw createConflictError('You are already in this studio');
    }

    const [count] = await db
      .select({ memberCount: sql<number>`COUNT(*)` })
      .from(studioMembers)
      .where(eq(studioMembers.studioId, studio.id));
    if (Number(count?.memberCount ?? 0) >= FREE_STUDENT_LIMIT) {
      throw createForbiddenError(
        'This studio is full on the free plan — the teacher needs to upgrade to add more students',
      );
    }

    await db.insert(studioMembers).values({ studioId: studio.id, userId: user.id }).returning();

    return { studioId: studio.id, studioName: studio.name };
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/join', operation: 'join' });
  }
});
