/**
 * Tests for server/api/songs/[id].put.ts
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

import songPut from './[id].put';

const VALID_ID = '11111111-1111-1111-1111-111111111111';

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('PUT /api/songs/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => ({ id: 'u-1' }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await songPut(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await songPut(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await songPut(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid difficulty', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { difficulty: 'guru' };
    const res = await songPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid instrumentType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { instrumentType: 'ukulele' };
    const res = await songPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { format: 'scribble' };
    const res = await songPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when no valid fields provided', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { unknownField: 'x' };
    const res = await songPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ updateReturning: [{ id: VALID_ID, title: 'Updated' }] }),
    );
    nextBody = { title: 'Updated' };
    const res = await songPut(makeEvent());
    expect(res.title).toBe('Updated');
  });

  it('returns 404 when update returns nothing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ updateReturning: [] }));
    nextBody = { title: 'Updated' };
    const res = await songPut(makeEvent());
    expect(res.statusCode).toBe(404);
  });
});
