/**
 * Tests for server/api/sessions/[id].delete.ts
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

import sessionDelete from './[id].delete';

const VALID_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('DELETE /api/sessions/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await sessionDelete(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await sessionDelete(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await sessionDelete(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when session does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await sessionDelete(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 when session belongs to a different user', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ userId: 'other-user' }] }));
    const res = await sessionDelete(makeEvent());
    expect(res.statusCode).toBe(403);
  });

  it('returns 200 with deleted id on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ userId: USER_ID }],
        deleteReturning: [{ id: VALID_ID }],
      }),
    );
    const res = await sessionDelete(makeEvent());
    expect(res.message).toMatch(/deleted/);
    expect(res.id).toBe(VALID_ID);
  });

  it('returns 404 when delete returns nothing', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ userId: USER_ID }],
        deleteReturning: [],
      }),
    );
    const res = await sessionDelete(makeEvent());
    expect(res.statusCode).toBe(404);
  });
});
