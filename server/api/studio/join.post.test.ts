/**
 * Tests for server/api/studio/join.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

// join.post.ts only needs FREE_STUDENT_LIMIT from utils/studio. Mocking the
// whole module avoids pulling in the real requireOwnedStudio (and its
// transitive `../db` real-connection import).
vi.mock('../../utils/studio', () => ({ FREE_STUDENT_LIMIT: 3 }));

const applyRateLimitMock = vi.fn(async () => undefined);
const checkRateLimitMock = vi.fn(() => undefined);
const getRateLimitKeyMock = vi.fn(async (_e: unknown, ns: string) => `${ns}:test`);
vi.mock('../../utils/rate-limit', () => ({
  applyRateLimit: (...args: unknown[]) => applyRateLimitMock(...args),
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getRateLimitKey: (...args: unknown[]) => getRateLimitKeyMock(...args),
}));

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

import studioJoinPost from './join.post';

const STUDENT_ID = '11111111-1111-1111-1111-111111111111';
const OWNER_ID = '44444444-4444-4444-4444-444444444444';
const STUDIO_ID = '22222222-2222-2222-2222-222222222222';
const INVITE_ID = '33333333-3333-3333-3333-333333333333';
const VALID_TOKEN = 'valid-invite-token';

const SAMPLE_INVITE = {
  id: INVITE_ID,
  studioId: STUDIO_ID,
  token: VALID_TOKEN,
  expiresAt: new Date('2099-01-01T00:00:00Z'),
  revoked: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

const SAMPLE_STUDIO = {
  id: STUDIO_ID,
  ownerId: OWNER_ID,
  name: 'Test Studio',
  weeklyTargetMinutes: 90,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/studio/join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = { token: VALID_TOKEN };
    requireAuthMock.mockImplementation(async () => ({ id: STUDENT_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when token is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {};
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 410 for an unknown token', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[]] }));
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(410);
  });

  it('returns 410 for an expired invite', async () => {
    const expired = { ...SAMPLE_INVITE, expiresAt: new Date('2020-01-01T00:00:00Z') };
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[expired]] }));
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(410);
  });

  it('returns 410 for a revoked invite', async () => {
    const revoked = { ...SAMPLE_INVITE, revoked: true };
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[revoked]] }));
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(410);
  });

  it('returns 400 when the caller is the studio owner', async () => {
    const ownStudio = { ...SAMPLE_STUDIO, ownerId: STUDENT_ID };
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectQueue: [[SAMPLE_INVITE], [ownStudio]] }),
    );
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when already a member', async () => {
    const existingMembership = {
      id: 'membership-1',
      studioId: STUDIO_ID,
      userId: STUDENT_ID,
      joinedAt: new Date('2024-01-01T00:00:00Z'),
    };
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [[SAMPLE_INVITE], [SAMPLE_STUDIO], [existingMembership]],
      }),
    );
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(409);
  });

  it('returns 403 when the studio is full', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [[SAMPLE_INVITE], [SAMPLE_STUDIO], [], [{ memberCount: 3 }]],
      }),
    );
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBe(403);
  });

  it('returns studio info on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [[SAMPLE_INVITE], [SAMPLE_STUDIO], [], [{ memberCount: 1 }]],
      }),
    );
    const res = await studioJoinPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
    expect(res).toEqual({ studioId: STUDIO_ID, studioName: SAMPLE_STUDIO.name });
  });
});
