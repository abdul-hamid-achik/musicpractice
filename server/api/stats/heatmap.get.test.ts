/**
 * Tests for server/api/stats/heatmap.get.ts
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

import heatmapGet from './heatmap.get';

const USER_ID = '11111111-1111-1111-1111-111111111111';
function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/stats/heatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await heatmapGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with empty array when no data', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await heatmapGet(makeEvent());
    expect(res).toEqual([]);
  });

  it('returns 200 with rows when there is data', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ date: '2024-01-01', totalMinutes: 30, sessionCount: 2 }],
      }),
    );
    const res = await heatmapGet(makeEvent());
    expect(res).toHaveLength(1);
    expect(res[0].date).toBe('2024-01-01');
    expect(res[0].totalMinutes).toBe(30);
  });
});
