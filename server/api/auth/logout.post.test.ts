/**
 * Tests for server/api/auth/logout.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clearAuthCookieMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  clearAuthCookie: (...args: unknown[]) => clearAuthCookieMock(...args),
}));

import logoutHandler from './logout.post';

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears the auth cookie and returns success', async () => {
    const res = await logoutHandler(makeEvent());
    expect(clearAuthCookieMock).toHaveBeenCalled();
    expect(res).toEqual({ success: true });
  });
});
