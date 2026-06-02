/**
 * Tests for server/api/account/index.delete.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

// Mock the rate-limit module so it doesn't block subsequent tests in this file
const applyRateLimitMock = vi.fn(async () => undefined);
const checkRateLimitMock = vi.fn(() => undefined);
const getRateLimitKeyMock = vi.fn(async (_e: unknown, ns: string) => `${ns}:test`);
vi.mock('../../utils/rate-limit', () => ({
  applyRateLimit: (...args: unknown[]) => applyRateLimitMock(...args),
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getRateLimitKey: (...args: unknown[]) => getRateLimitKeyMock(...args),
}));

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
const clearAuthCookieMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  clearAuthCookie: (...args: unknown[]) => clearAuthCookieMock(...args),
}));

vi.mock('../../db', () => ({ db: {} }));

import deleteHandler from './index.delete';

const SAMPLE_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'a@b.com',
  username: 'alpha',
  name: 'Alpha',
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

describe('DELETE /api/account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => SAMPLE_USER);
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await deleteHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when confirmation is missing or wrong', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { confirmation: 'delete' };
    const res = await deleteHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when body is empty', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {};
    const res = await deleteHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on success, clears cookie', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ deleteReturning: [SAMPLE_USER] }));
    nextBody = { confirmation: 'DELETE' };
    const res = await deleteHandler(makeEvent());
    expect(res.success).toBe(true);
    expect(clearAuthCookieMock).toHaveBeenCalled();
  });

  it('returns 500 when delete returns no user', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ deleteReturning: [] }));
    nextBody = { confirmation: 'DELETE' };
    const res = await deleteHandler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
