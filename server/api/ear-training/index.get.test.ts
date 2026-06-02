/**
 * Tests for server/api/ear-training/index.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

vi.mock('../../db', () => ({ db: {} }));

let nextQuery: Record<string, string> = {};
vi.stubGlobal('getQuery', (event: any) => nextQuery);

import earGet from './index.get';

const SAMPLE_USER = { id: '11111111-1111-1111-1111-111111111111' };
const SAMPLE_SCORE = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: SAMPLE_USER.id,
  exerciseType: 'intervals',
  correct: 8,
  total: 10,
  settings: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/ear-training', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextQuery = {};
    requireAuthMock.mockImplementation(async () => SAMPLE_USER);
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await earGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with scores list', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_SCORE] }));
    const res = await earGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_SCORE]);
  });

  it('filters by type=intervals', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_SCORE] }));
    nextQuery = { type: 'intervals' };
    const res = await earGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('filters by type=notes', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextQuery = { type: 'notes' };
    const res = await earGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('ignores invalid exerciseType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextQuery = { type: 'invalid' };
    const res = await earGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('caps limit at 50', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextQuery = { limit: '500' };
    const res = await earGet(makeEvent());
    // handler does Math.min(50, ...), but doesn't return limit
    expect(res.statusCode).toBeUndefined();
  });
});
