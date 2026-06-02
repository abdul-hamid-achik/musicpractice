/**
 * Tests for server/api/progress/[songId].put.ts
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

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

import progressPut from './[songId].put';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const SONG_ID = '22222222-2222-2222-2222-222222222222';
const SAMPLE_PROGRESS = {
  id: 'p-1',
  userId: USER_ID,
  songId: SONG_ID,
  completionPercent: 50,
  maxTempoBpm: 100,
  lastPracticedAt: new Date('2024-01-01T00:00:00Z'),
  practiceCount: 3,
};

function makeEvent(songId: string | null = SONG_ID): any {
  return {
    context: { params: songId !== null ? { songId } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('PUT /api/progress/:songId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await progressPut(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing songId', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await progressPut(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid songId format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await progressPut(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for out-of-range completionPercent', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { completionPercent: 150 };
    const res = await progressPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer maxTempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { maxTempoBpm: 1.5 };
    const res = await progressPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for negative maxTempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { maxTempoBpm: -1 };
    const res = await progressPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for negative practiceCount', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { practiceCount: -1 };
    const res = await progressPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid lastPracticedAt date', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { lastPracticedAt: 'not-a-date' };
    const res = await progressPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('inserts new progress when none exists', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [[]], // no existing progress
        insertReturning: [SAMPLE_PROGRESS],
      }),
    );
    nextBody = { completionPercent: 50, maxTempoBpm: 100 };
    const res = await progressPut(makeEvent());
    expect(res.id).toBe('p-1');
  });

  it('updates existing progress', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [[SAMPLE_PROGRESS]], // existing
        updateReturning: [{ ...SAMPLE_PROGRESS, completionPercent: 75 }],
      }),
    );
    nextBody = { completionPercent: 75 };
    const res = await progressPut(makeEvent());
    expect(res.completionPercent).toBe(75);
  });
});
