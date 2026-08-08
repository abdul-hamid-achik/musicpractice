import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { studioInvites } from '../../db/schema';
import { requireAuth } from '../../utils/auth';
import { requireOwnedStudio } from '../../utils/studio';
import { applyRateLimit } from '../../utils/rate-limit';
import { handleApiError } from '../../utils/errors';

const INVITE_TTL_DAYS = 14;

/**
 * Mint a fresh invite link for the caller's studio. Any previously
 * active links are revoked so there is exactly one live link to share.
 */
export default defineEventHandler(async (event) => {
  try {
    await applyRateLimit(event, 'studio:invite', 10);
    const user = await requireAuth(event);
    const db = useDb();
    const studio = await requireOwnedStudio(db, user);

    await db
      .update(studioInvites)
      .set({ revoked: true })
      .where(eq(studioInvites.studioId, studio.id));

    const token = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await db.insert(studioInvites).values({ studioId: studio.id, token, expiresAt }).returning();

    return { token, expiresAt };
  } catch (error) {
    return handleApiError(error, { route: '/api/studio/invite', operation: 'create' });
  }
});
