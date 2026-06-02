/**
 * Tests for server/api/scales/index.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

let nextQuery: Record<string, string> = {};
vi.stubGlobal('getQuery', (event: any) => nextQuery);

import scalesGet from './index.get';

const SAMPLE_SCALE = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Major',
  intervals: [0, 2, 4, 5, 7, 9, 11],
  category: 'diatonic',
  description: 'The major scale.',
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/scales', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextQuery = {};
  });

  it('returns 200 with paginated scales', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SCALE]] }));
    const res = await scalesGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_SCALE]);
    expect(res.total).toBe(1);
  });

  it('filters by category', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SCALE]] }));
    nextQuery = { category: 'diatonic' };
    const res = await scalesGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('respects page and limit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '2', limit: '10' };
    const res = await scalesGet(makeEvent());
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
  });
});
