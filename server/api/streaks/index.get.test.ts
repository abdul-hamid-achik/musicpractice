/**
 * Tests for server/api/streaks/index.get.ts
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

import streakGet from './index.get';

const USER_ID = '11111111-1111-1111-1111-111111111111';
function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

describe('GET /api/streaks', () => {
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
    const res = await streakGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when user not found', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await streakGet(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with current streak when practiced today', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ currentStreak: 5, longestStreak: 10, lastPracticeDate: todayStr() }],
      }),
    );
    const res = await streakGet(makeEvent());
    expect(res.currentStreak).toBe(5);
    expect(res.longestStreak).toBe(10);
    expect(res.practicedToday).toBe(true);
  });

  it('returns 200 with 0 streak when last practice was long ago', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ currentStreak: 5, longestStreak: 10, lastPracticeDate: '2020-01-01' }],
      }),
    );
    const res = await streakGet(makeEvent());
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(10);
    expect(res.practicedToday).toBe(false);
  });

  it('handles null lastPracticeDate', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ currentStreak: 0, longestStreak: 0, lastPracticeDate: null }],
      }),
    );
    const res = await streakGet(makeEvent());
    expect(res.currentStreak).toBe(0);
    expect(res.practicedToday).toBe(false);
  });
});
