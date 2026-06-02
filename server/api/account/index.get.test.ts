/**
 * Tests for server/api/account/index.get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAuthMock = vi.fn();
const getOptionalAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
  getOptionalAuth: (...args: unknown[]) => getOptionalAuthMock(...args),
}));

import accountHandler from './index.get';

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('GET /api/account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth required') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementation(async () => {
      throw err;
    });
    const res = await accountHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns the user on success', async () => {
    const user = {
      id: 'u1',
      email: 'a@b.com',
      username: 'a',
      name: 'A',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    requireAuthMock.mockImplementation(async () => user);
    const res = await accountHandler(makeEvent());
    expect(res).toEqual(user);
  });
});
