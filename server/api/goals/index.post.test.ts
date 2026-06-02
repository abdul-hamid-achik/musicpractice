/**
 * Tests for server/api/goals/index.post.ts
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

vi.mock('../../db', () => ({ db: {} }));

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

import goalsPost from './index.post';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const INSTRUMENT_ID = '33333333-3333-3333-3333-333333333333';
const SAMPLE_GOAL = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: USER_ID,
  instrumentId: INSTRUMENT_ID,
  title: 'Goal',
  description: null,
  targetMinutesPerWeek: 60,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/goals', () => {
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
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when title is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { targetMinutesPerWeek: 60 };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when targetMinutesPerWeek is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { title: 'Goal' };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid instrumentId', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { title: 'Goal', targetMinutesPerWeek: 60, instrumentId: 'not-a-uuid' };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive targetMinutesPerWeek', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { title: 'Goal', targetMinutesPerWeek: 0 };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer targetMinutesPerWeek', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { title: 'Goal', targetMinutesPerWeek: 1.5 };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 on happy path with instrument', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_GOAL] }));
    nextBody = { title: 'Goal', targetMinutesPerWeek: 60, instrumentId: INSTRUMENT_ID };
    const res = await goalsPost(makeEvent());
    expect(res.id).toBe(SAMPLE_GOAL.id);
  });

  it('returns 201 on happy path without instrument', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_GOAL] }));
    nextBody = { title: 'Goal', targetMinutesPerWeek: 60 };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('accepts optional description', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_GOAL] }));
    nextBody = { title: 'Goal', targetMinutesPerWeek: 60, description: 'Some description' };
    const res = await goalsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });
});
