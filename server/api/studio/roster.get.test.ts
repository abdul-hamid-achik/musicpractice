/**
 * Tests for server/api/studio/roster.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

const requireOwnedStudioMock = vi.fn();
vi.mock('../../utils/studio', () => ({
  requireOwnedStudio: (...args: unknown[]) => requireOwnedStudioMock(...args),
}));

import studioRosterGet from './roster.get';

const OWNER_ID = '11111111-1111-1111-1111-111111111111';
const STUDIO_ID = '22222222-2222-2222-2222-222222222222';
const ALICE_ID = '33333333-3333-3333-3333-333333333333';
const BOB_ID = '44444444-4444-4444-4444-444444444444';

const SAMPLE_STUDIO = {
  id: STUDIO_ID,
  name: 'Test Studio',
  weeklyTargetMinutes: 90,
};

const MEMBERS = [
  {
    userId: ALICE_ID,
    joinedAt: new Date('2024-01-01T00:00:00Z'),
    name: 'Alice',
    username: 'alice',
    currentStreak: 5,
  },
  {
    userId: BOB_ID,
    joinedAt: new Date('2024-01-02T00:00:00Z'),
    name: 'Bob',
    username: 'bob',
    currentStreak: 2,
  },
];

const MINUTE_ROWS = [
  { userId: ALICE_ID, instrumentType: 'guitar', minutes: 60 },
  { userId: ALICE_ID, instrumentType: 'piano', minutes: 40 },
  { userId: BOB_ID, instrumentType: 'violin', minutes: 20 },
];

const ASSIGNMENT_ROWS = [
  { studentId: ALICE_ID, completedAt: null },
  { studentId: ALICE_ID, completedAt: new Date('2024-01-05T00:00:00Z') },
  { studentId: BOB_ID, completedAt: null },
];

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/studio/roster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockImplementation(async () => ({ id: OWNER_ID }));
    requireOwnedStudioMock.mockImplementation(async () => SAMPLE_STUDIO);
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await studioRosterGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 when the caller has no studio', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const err = new Error('not found') as Error & { statusCode?: number };
    err.statusCode = 404;
    requireOwnedStudioMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await studioRosterGet(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns an empty roster when the studio has no members', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await studioRosterGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
    expect(res.studio).toEqual(SAMPLE_STUDIO);
    expect(res.roster).toEqual([]);
  });

  it('builds the roster with minutes, top instrument, status, and open assignments', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ selectQueue: [MEMBERS, MINUTE_ROWS, ASSIGNMENT_ROWS] }),
    );
    const res = await studioRosterGet(makeEvent());
    expect(res.statusCode).toBeUndefined();
    expect(res.roster).toHaveLength(2);

    // Sorted by minutesThisWeek desc: Alice (100) before Bob (20).
    const [first, second] = res.roster;
    expect(first.userId).toBe(ALICE_ID);
    expect(first.minutesThisWeek).toBe(100);
    expect(first.topInstrument).toBe('guitar');
    expect(first.status).toBe('on');
    expect(first.assignmentsOpen).toBe(1);

    expect(second.userId).toBe(BOB_ID);
    expect(second.minutesThisWeek).toBe(20);
    expect(second.topInstrument).toBe('violin');
    expect(second.status).toBe('off');
    expect(second.assignmentsOpen).toBe(1);
  });
});
