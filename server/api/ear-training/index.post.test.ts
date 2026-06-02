/**
 * Tests for server/api/ear-training/index.post.ts
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

import earPost from './index.post';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_SCORE = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: USER_ID,
  exerciseType: 'intervals',
  correct: 8,
  total: 10,
  settings: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/ear-training', () => {
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
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when exerciseType is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { correct: 5, total: 10 };
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid exerciseType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { exerciseType: 'chords', correct: 5, total: 10 };
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for negative correct count', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { exerciseType: 'intervals', correct: -1, total: 10 };
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for zero total', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { exerciseType: 'intervals', correct: 0, total: 0 };
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer correct count', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { exerciseType: 'intervals', correct: 1.5, total: 10 };
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 on happy path', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_SCORE] }));
    nextBody = { exerciseType: 'intervals', correct: 8, total: 10 };
    const res = await earPost(makeEvent());
    expect(res.id).toBe(SAMPLE_SCORE.id);
  });

  it('accepts optional settings', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_SCORE] }));
    nextBody = { exerciseType: 'notes', correct: 5, total: 10, settings: { range: [60, 72] } };
    const res = await earPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });
});
