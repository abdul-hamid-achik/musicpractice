/**
 * Tests for server/api/stats/daily.get.ts
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

import dailyGet from './daily.get';

const USER_ID = '11111111-1111-1111-1111-111111111111';
function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/stats/daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextQuery = {};
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await dailyGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with 14 days of zero data by default', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await dailyGet(makeEvent());
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(14);
    for (const row of res) {
      expect(row.totalMinutes).toBe(0);
      expect(row.sessionCount).toBe(0);
    }
  });

  it('returns 400 for non-integer days', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { days: 'abc' };
    const res = await dailyGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('clamps days to min=1', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextQuery = { days: '0' };
    const res = await dailyGet(makeEvent());
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(1);
  });

  it('clamps days to max=90', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextQuery = { days: '500' };
    const res = await dailyGet(makeEvent());
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(90);
  });

  it('returns data for each day in the range', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextQuery = { days: '7' };
    const res = await dailyGet(makeEvent());
    expect(res.length).toBe(7);
  });
});
