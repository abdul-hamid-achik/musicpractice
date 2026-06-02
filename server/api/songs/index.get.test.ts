/**
 * Tests for server/api/songs/index.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

let nextQuery: Record<string, string> = {};
vi.stubGlobal('getQuery', (event: any) => nextQuery);

import songsGet from './index.get';

const SAMPLE_SONG = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Sample Song',
  artist: 'Artist',
  difficulty: 'beginner',
  instrumentType: 'guitar',
  format: 'alphatex',
  notationData: '{}',
  metadata: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/songs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextQuery = {};
  });

  it('returns 200 with paginated songs and total', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SONG]] }));
    const res = await songsGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_SONG]);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
  });

  it('searches by title and artist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_SONG]] }));
    nextQuery = { search: 'Sample' };
    const res = await songsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('filters by instrumentType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { instrumentType: 'guitar' };
    const res = await songsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('rejects invalid instrumentType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { instrumentType: 'ukulele' };
    const res = await songsGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('filters by difficulty', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { difficulty: 'beginner' };
    const res = await songsGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('rejects invalid difficulty', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextQuery = { difficulty: 'impossible' };
    const res = await songsGet(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('caps limit at 100', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { limit: '500' };
    const res = await songsGet(makeEvent());
    expect(res.limit).toBe(100);
  });

  it('respects page and limit query params', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    nextQuery = { page: '2', limit: '10' };
    const res = await songsGet(makeEvent());
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
  });
});
