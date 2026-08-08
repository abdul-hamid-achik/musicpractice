/**
 * Tests for server/api/studio/assignments/index.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

const requireOwnedStudioMock = vi.fn();
vi.mock('../../../utils/studio', () => ({
  requireOwnedStudio: (...args: unknown[]) => requireOwnedStudioMock(...args),
}));

const applyRateLimitMock = vi.fn(async () => undefined);
const checkRateLimitMock = vi.fn(() => undefined);
const getRateLimitKeyMock = vi.fn(async (_e: unknown, ns: string) => `${ns}:test`);
vi.mock('../../../utils/rate-limit', () => ({
  applyRateLimit: (...args: unknown[]) => applyRateLimitMock(...args),
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getRateLimitKey: (...args: unknown[]) => getRateLimitKeyMock(...args),
}));

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

import studioAssignmentsPost from './index.post';

const OWNER_ID = '11111111-1111-1111-1111-111111111111';
const STUDIO_ID = '22222222-2222-2222-2222-222222222222';
const STUDENT_ID = '33333333-3333-3333-3333-333333333333';
const SONG_ID = '44444444-4444-4444-4444-444444444444';
const ASSIGNMENT_ID = '55555555-5555-5555-5555-555555555555';

const SAMPLE_STUDIO = {
  id: STUDIO_ID,
  ownerId: OWNER_ID,
  name: 'Test Studio',
  weeklyTargetMinutes: 90,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const SAMPLE_MEMBERSHIP = {
  id: 'membership-1',
  studioId: STUDIO_ID,
  userId: STUDENT_ID,
  joinedAt: new Date('2024-01-01T00:00:00Z'),
};

const SAMPLE_ASSIGNMENT = {
  id: ASSIGNMENT_ID,
  studioId: STUDIO_ID,
  studentId: STUDENT_ID,
  songId: null,
  title: 'Practice scales',
  notes: null,
  completedAt: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/studio/assignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = { studentId: STUDENT_ID, title: 'Practice scales' };
    requireAuthMock.mockImplementation(async () => ({ id: OWNER_ID }));
    requireOwnedStudioMock.mockImplementation(async () => SAMPLE_STUDIO);
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when studentId is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { title: 'Practice scales' };
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when studentId is not a valid UUID', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { studentId: 'not-a-uuid', title: 'Practice scales' };
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when title is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { studentId: STUDENT_ID };
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for an invalid songId', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { studentId: STUDENT_ID, title: 'Practice scales', songId: 'not-a-uuid' };
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 403 when the student is not a studio member', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBe(403);
  });

  it('returns the created assignment on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectLimit: [SAMPLE_MEMBERSHIP], insertReturning: [SAMPLE_ASSIGNMENT] }),
    );
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
    expect(res.id).toBe(ASSIGNMENT_ID);
  });

  it('accepts a valid songId', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [SAMPLE_MEMBERSHIP],
        insertReturning: [{ ...SAMPLE_ASSIGNMENT, songId: SONG_ID }],
      }),
    );
    nextBody = { studentId: STUDENT_ID, title: 'Practice scales', songId: SONG_ID };
    const res = await studioAssignmentsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
    expect(res.songId).toBe(SONG_ID);
  });
});
