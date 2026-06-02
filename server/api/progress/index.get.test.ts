/**
 * Tests for server/api/progress/index.get.ts
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

import progressGet from './index.get';

const SAMPLE_USER = { id: '11111111-1111-1111-1111-111111111111' };
const SAMPLE_PROGRESS = {
  id: 'p-1',
  userId: SAMPLE_USER.id,
  songId: '22222222-2222-2222-2222-222222222222',
  songTitle: 'Sample',
  completionPercent: 50,
  maxTempoBpm: 100,
  lastPracticedAt: new Date('2024-01-01T00:00:00Z'),
  practiceCount: 3,
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/progress', () => {
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
    const res = await progressGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with paginated progress entries', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_PROGRESS]] }),
    );
    const res = await progressGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_PROGRESS]);
    expect(res.total).toBe(1);
  });

  it('filters by songId', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_PROGRESS]] }),
    );
    nextQuery = { songId: '22222222-2222-2222-2222-222222222222' };
    const res = await progressGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('rejects invalid songId format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { songId: 'not-a-uuid' };
    const res = await progressGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('respects page and limit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '2', limit: '50' };
    const res = await progressGet(makeEvent());
    expect(res.page).toBe(2);
    expect(res.limit).toBe(50);
  });
});
