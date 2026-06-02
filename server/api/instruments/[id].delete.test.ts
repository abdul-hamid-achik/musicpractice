/**
 * Tests for server/api/instruments/[id].delete.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock, makeChain } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

vi.mock('../../db', () => ({ db: {} }));

import instrumentDelete from './[id].delete';

const VALID_ID = '11111111-1111-1111-1111-111111111111';

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('DELETE /api/instruments/:id', () => {
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
    const res = await instrumentDelete(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await instrumentDelete(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await instrumentDelete(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when instrument does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ deleteReturning: [] }));
    const res = await instrumentDelete(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ deleteReturning: [{ id: VALID_ID }] }));
    const res = await instrumentDelete(makeEvent());
    expect(res.message).toMatch(/deleted/);
    expect(res.id).toBe(VALID_ID);
  });

  it('returns 409 on foreign key violation', async () => {
    const fkError = new Error('insert or update on table violates foreign key');
    const chain = makeChain({ returningValue: undefined });
    // override the chain's `then` so the await throws
    chain.then = (_resolve: (v: unknown) => void, reject: (e: unknown) => void) => reject(fkError);
    useDbMock.mockReturnValue({ delete: () => chain });
    const res = await instrumentDelete(makeEvent());
    expect(res.statusCode).toBe(409);
  });
});
