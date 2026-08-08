/**
 * Tests for server/api/studio/index.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

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

import studioPost from './index.post';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const STUDIO_ID = '22222222-2222-2222-2222-222222222222';
const SAMPLE_STUDIO = {
  id: STUDIO_ID,
  ownerId: USER_ID,
  name: 'Test Studio',
  weeklyTargetMinutes: 90,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/studio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await studioPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {};
    const res = await studioPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when name is blank', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: '   ' };
    const res = await studioPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer weeklyTargetMinutes', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Studio', weeklyTargetMinutes: 1.5 };
    const res = await studioPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive weeklyTargetMinutes', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Studio', weeklyTargetMinutes: 0 };
    const res = await studioPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when a studio already exists', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_STUDIO] }));
    nextBody = { name: 'Studio' };
    const res = await studioPost(makeEvent());
    expect(res.statusCode).toBe(409);
  });

  it('returns the created studio on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectLimit: [], insertReturning: [SAMPLE_STUDIO] }),
    );
    nextBody = { name: 'Studio' };
    const res = await studioPost(makeEvent());
    expect(res.id).toBe(STUDIO_ID);
    expect(res.statusCode).toBeUndefined();
  });
});
