/**
 * Tests for server/api/sessions/[id].get.ts
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

import sessionGet from './[id].get';

const VALID_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_SESSION = {
  id: VALID_ID,
  userId: 'u-1',
  instrumentId: 'i-1',
  instrumentName: 'Guitar',
  startedAt: new Date('2024-01-01T00:00:00Z'),
  endedAt: null,
  durationSeconds: 600,
  tempoBpm: 100,
  notes: null,
  tags: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('GET /api/sessions/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockImplementation(async () => ({ id: 'u-1' }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await sessionGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await sessionGet(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await sessionGet(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when session does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await sessionGet(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with session on success', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_SESSION] }));
    const res = await sessionGet(makeEvent());
    expect(res.id).toBe(VALID_ID);
  });
});
