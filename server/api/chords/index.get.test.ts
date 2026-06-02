/**
 * Tests for server/api/chords/index.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

let nextQuery: Record<string, string> = {};
vi.stubGlobal('getQuery', (event: any) => nextQuery);

import chordsGet from './index.get';

const SAMPLE_CHORD = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'C Major',
  symbol: 'C',
  intervals: [0, 4, 7],
  voicings: {
    guitar: [
      [0, 3],
      [1, 3],
    ],
  },
  instrumentType: 'guitar',
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/chords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextQuery = {};
  });

  it('returns 200 with paginated chords', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_CHORD]] }));
    const res = await chordsGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_CHORD]);
    expect(res.total).toBe(1);
  });

  it('filters by instrumentType=guitar', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_CHORD]] }));
    nextQuery = { instrumentType: 'guitar' };
    const res = await chordsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('returns 400 for invalid instrumentType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { instrumentType: 'ukulele' };
    const res = await chordsGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('respects page and limit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '2', limit: '10' };
    const res = await chordsGet(makeEvent());
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
  });
});
