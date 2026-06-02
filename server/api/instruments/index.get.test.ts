/**
 * Tests for server/api/instruments/index.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

let nextQuery: Record<string, string> = {};
vi.stubGlobal('getQuery', (event: any) => nextQuery);

import instrumentsGet from './index.get';

const SAMPLE_INSTRUMENT = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Acoustic Guitar',
  type: 'guitar',
  tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
  stringCount: 6,
  fretCount: 22,
  isDefault: true,
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/instruments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextQuery = {};
  });

  it('returns 200 with paginated instruments and total', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_INSTRUMENT]] }),
    );
    const res = await instrumentsGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_INSTRUMENT]);
    expect(res.total).toBe(1);
  });

  it('filters by type=guitar', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_INSTRUMENT]] }),
    );
    nextQuery = { type: 'guitar' };
    const res = await instrumentsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('returns 400 for invalid type', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { type: 'ukulele' };
    const res = await instrumentsGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('respects page and limit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '2', limit: '10' };
    const res = await instrumentsGet(makeEvent());
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
  });
});
