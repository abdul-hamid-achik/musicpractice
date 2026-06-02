/**
 * Tests for server/api/goals/index.get.ts
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

import goalsGet from './index.get';

const SAMPLE_USER = { id: '11111111-1111-1111-1111-111111111111' };
const SAMPLE_GOAL = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: SAMPLE_USER.id,
  instrumentId: null,
  instrumentName: null,
  title: 'Practice 30 min/day',
  description: null,
  targetMinutesPerWeek: 210,
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/goals', () => {
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
    const res = await goalsGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with paginated goals', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_GOAL]] }));
    const res = await goalsGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_GOAL]);
    expect(res.total).toBe(1);
  });

  it('filters by isActive=true', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_GOAL]] }));
    nextQuery = { isActive: 'true' };
    const res = await goalsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('filters by isActive=false', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { isActive: 'false' };
    const res = await goalsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('respects page and limit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '2', limit: '50' };
    const res = await goalsGet(makeEvent());
    expect(res.page).toBe(2);
    expect(res.limit).toBe(50);
  });
});
