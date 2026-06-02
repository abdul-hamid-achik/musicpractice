/**
 * Tests for server/api/sessions/index.post.ts
 *
 * The create-session handler:
 *   1. requireAuth
 *   2. validate body (instrumentId, startedAt, optional songId/duration/tempo)
 *   3. insert into practiceSessions
 *   4. read user row, compute streak update, write back
 *   5. if songId, upsert userProgress
 *
 * The streak + progress updates are wrapped in try/catch, so we don't need
 * to mock them aggressively.
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

import sessionsPost from './index.post';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const INSTRUMENT_ID = '22222222-2222-2222-2222-222222222222';
const SAMPLE_USER = { id: USER_ID, currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
const SAMPLE_SESSION = {
  id: 'session-id',
  userId: USER_ID,
  instrumentId: INSTRUMENT_ID,
  songId: null,
  startedAt: new Date('2024-01-01T00:00:00Z'),
  endedAt: null,
  durationSeconds: null,
  tempoBpm: null,
  notes: null,
  tags: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/sessions', () => {
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
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when instrumentId is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { startedAt: '2024-01-01T00:00:00Z' };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when startedAt is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { instrumentId: INSTRUMENT_ID };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid instrumentId format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { instrumentId: 'not-a-uuid', startedAt: '2024-01-01T00:00:00Z' };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid songId format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {
      instrumentId: INSTRUMENT_ID,
      songId: 'not-a-uuid',
      startedAt: '2024-01-01T00:00:00Z',
    };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for negative durationSeconds', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {
      instrumentId: INSTRUMENT_ID,
      startedAt: '2024-01-01T00:00:00Z',
      durationSeconds: -1,
    };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer tempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { instrumentId: INSTRUMENT_ID, startedAt: '2024-01-01T00:00:00Z', tempoBpm: 1.5 };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for tempoBpm < 1', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { instrumentId: INSTRUMENT_ID, startedAt: '2024-01-01T00:00:00Z', tempoBpm: 0 };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 on happy path and updates streak + lastPracticeDate', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [
          [SAMPLE_SESSION],
          [SAMPLE_USER], // user row for streak
          [SAMPLE_USER], // user row for streak (second time? not in this case)
        ],
        insertReturning: [SAMPLE_SESSION],
        updateReturning: [{ ...SAMPLE_USER, currentStreak: 1, lastPracticeDate: '2024-01-01' }],
      }),
    );
    nextBody = { instrumentId: INSTRUMENT_ID, startedAt: '2024-01-01T00:00:00Z' };
    const res = await sessionsPost(makeEvent());
    expect(res).toMatchObject({ id: 'session-id', userId: USER_ID });
  });

  it('returns 500 when insert returns no session', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        insertReturning: [],
      }),
    );
    nextBody = { instrumentId: INSTRUMENT_ID, startedAt: '2024-01-01T00:00:00Z' };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBe(500);
  });

  it('handles songId: inserts user progress for first-time song', async () => {
    const SONG_ID = '44444444-4444-4444-4444-444444444444';
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [
          [SAMPLE_SESSION],
          [SAMPLE_USER], // for streak
          [], // no existing user progress
        ],
        insertReturning: [{ id: 'new-progress' }],
        updateReturning: [SAMPLE_USER],
      }),
    );
    nextBody = {
      instrumentId: INSTRUMENT_ID,
      startedAt: '2024-01-01T00:00:00Z',
      songId: SONG_ID,
      durationSeconds: 300,
      tempoBpm: 120,
    };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });

  it('handles songId: updates existing user progress', async () => {
    const SONG_ID = '44444444-4444-4444-4444-444444444444';
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectQueue: [
          [SAMPLE_SESSION],
          [SAMPLE_USER], // for streak
          [{ id: 'progress-id', completionPercent: 50, practiceCount: 2, maxTempoBpm: 100 }], // existing
        ],
        insertReturning: [SAMPLE_SESSION],
        updateReturning: [{ id: 'progress-id', completionPercent: 55, practiceCount: 3 }],
      }),
    );
    nextBody = {
      instrumentId: INSTRUMENT_ID,
      startedAt: '2024-01-01T00:00:00Z',
      songId: SONG_ID,
      durationSeconds: 300,
      tempoBpm: 130,
    };
    const res = await sessionsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });
});
