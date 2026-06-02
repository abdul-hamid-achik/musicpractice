/**
 * Tests for server/api/sessions/[id].put.ts
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

import sessionPut from './[id].put';

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

describe('PUT /api/sessions/:id', () => {
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
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await sessionPut(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await sessionPut(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when session does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextBody = { notes: 'updated' };
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 403 when session belongs to a different user', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ userId: 'other-user' }] }));
    nextBody = { notes: 'updated' };
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(403);
  });

  it('returns 400 for negative durationSeconds', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ userId: USER_ID }] }));
    nextBody = { durationSeconds: -1 };
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer tempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ userId: USER_ID }] }));
    nextBody = { tempoBpm: 1.5 };
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when no valid fields provided', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ userId: USER_ID }] }));
    nextBody = { unknownField: 'value' };
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ userId: USER_ID }],
        updateReturning: [{ id: VALID_ID, notes: 'updated' }],
      }),
    );
    nextBody = { notes: 'updated' };
    const res = await sessionPut(makeEvent());
    expect(res.notes).toBe('updated');
  });

  it('returns 404 when update returns nothing', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ userId: USER_ID }],
        updateReturning: [],
      }),
    );
    nextBody = { notes: 'updated' };
    const res = await sessionPut(makeEvent());
    expect(res.statusCode).toBe(404);
  });
});
