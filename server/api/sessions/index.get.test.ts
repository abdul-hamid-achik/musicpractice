/**
 * Tests for server/api/sessions/index.get.ts
 *
 * The handler makes TWO select() calls: one for COUNT and one for the data.
 * `makeDrizzleMock({ selectQueue: [...] })` feeds them in order.
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

import sessionsGet from './index.get';

const SAMPLE_USER = { id: '11111111-1111-1111-1111-111111111111' };
const SAMPLE_SESSION = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: SAMPLE_USER.id,
  instrumentId: '33333333-3333-3333-3333-333333333333',
  instrumentName: 'Guitar',
  songId: null,
  songTitle: null,
  startedAt: new Date('2024-01-01T00:00:00Z'),
  endedAt: null,
  durationSeconds: 600,
  tempoBpm: 100,
  notes: null,
  tags: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/sessions', () => {
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
    const res = await sessionsGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with paginated sessions and total count', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SESSION]] }));
    const res = await sessionsGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_SESSION]);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
  });

  it('respects page and limit query params', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '3', limit: '50' };
    const res = await sessionsGet(makeEvent());
    expect(res.page).toBe(3);
    expect(res.limit).toBe(50);
  });

  it('caps limit at 100', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { limit: '500' };
    const res = await sessionsGet(makeEvent());
    expect(res.limit).toBe(100);
  });

  it('rejects invalid instrumentId format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { instrumentId: 'not-a-uuid' };
    const res = await sessionsGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('accepts a valid instrumentId and filters by it', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SESSION]] }));
    nextQuery = { instrumentId: '33333333-3333-3333-3333-333333333333' };
    const res = await sessionsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('accepts startDate and endDate filters', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SESSION]] }));
    nextQuery = { startDate: '2024-01-01', endDate: '2024-12-31' };
    const res = await sessionsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });
});
