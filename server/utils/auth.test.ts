/**
 * Tests for server/utils/auth.ts
 *
 * `auth.ts` imports `../db` directly. We mock it with `vi.mock` so we can
 * control which users `requireAuth` / `getOptionalAuth` resolve.
 *
 * The JWT secret is set in tests/setup.ts (>= 32 chars).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Hoisted mock for the db module
const mockDbState: { users: Record<string, Record<string, unknown> | undefined> } = {
  users: {},
};

const mockSelect = vi.fn(() => {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(async () => {
      // `limit(1)` returns the matching user or []
      const captured = chain._userId as string | undefined;
      const user = captured ? mockDbState.users[captured] : undefined;
      return user ? [user] : [];
    }),
  };
  return chain;
});
mockSelect._setUserId = (id: string) => {
  mockSelect.mockImplementation(() => {
    const chain: Record<string, unknown> = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      limit: vi.fn(async () => {
        const user = mockDbState.users[id];
        return user ? [user] : [];
      }),
    };
    return chain;
  });
};

vi.mock('../db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

import {
  createAuthToken,
  requireAuth,
  getOptionalAuth,
  setAuthCookie,
  clearAuthCookie,
  type AuthUser,
} from './auth';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';

const userRow: AuthUser & { passwordHash: string } = {
  id: USER_ID,
  email: 'a@b.com',
  username: 'a',
  name: 'A',
  avatarUrl: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  passwordHash: 'should-never-leak',
};

const SECRET = 'test-jwt-secret-at-least-32-characters-long-for-tests';

function makeEvent(opts: { token?: string } = {}): any {
  return {
    context: {},
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: { 'auth-token': opts.token },
  };
}

describe('createAuthToken', () => {
  it('produces a JWT that verify() accepts', () => {
    const token = createAuthToken(USER_ID);
    const payload = jwt.verify(token, SECRET) as { userId: string };
    expect(payload.userId).toBe(USER_ID);
  });

  it('produces tokens that include a future iat/exp', () => {
    const token = createAuthToken(USER_ID);
    const payload = jwt.verify(token, SECRET) as { iat: number; exp: number };
    // iat is seconds since epoch; 7-day exp
    const sevenDays = 7 * 24 * 60 * 60;
    expect(payload.exp - payload.iat).toBe(sevenDays);
  });

  it('produces different tokens at different iat timestamps', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const t1 = createAuthToken(USER_ID);
      vi.setSystemTime(new Date('2026-01-01T00:00:30Z'));
      const t2 = createAuthToken(USER_ID);
      expect(t1).not.toBe(t2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('setAuthCookie / clearAuthCookie', () => {
  it('setAuthCookie calls setCookie with the auth-token name and 7-day maxAge', () => {
    const setCookie = vi.fn();
    vi.stubGlobal('setCookie', setCookie);
    const event = makeEvent();
    setAuthCookie(event, 'TOKEN_VALUE');
    expect(setCookie).toHaveBeenCalledWith(
      event,
      'auth-token',
      'TOKEN_VALUE',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      }),
    );
  });

  it('clearAuthCookie calls deleteCookie with the auth-token name', () => {
    const deleteCookie = vi.fn();
    vi.stubGlobal('deleteCookie', deleteCookie);
    const event = makeEvent();
    clearAuthCookie(event);
    expect(deleteCookie).toHaveBeenCalledWith(
      event,
      'auth-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    mockDbState.users = { [USER_ID]: userRow };
    mockSelect._setUserId(USER_ID);
    vi.stubGlobal('getCookie', (event: any, name: string) => event.cookies?.[name]);
  });

  it('returns the user (without passwordHash) when token is valid', async () => {
    const token = createAuthToken(USER_ID);
    const event = makeEvent({ token });
    const user = await requireAuth(event);
    expect(user.id).toBe(USER_ID);
    expect(user.email).toBe('a@b.com');
    expect((user as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('throws 401 when no cookie present', async () => {
    const event = makeEvent();
    try {
      await requireAuth(event);
      throw new Error('expected throw');
    } catch (e) {
      expect((e as Error & { statusCode?: number }).statusCode).toBe(401);
    }
  });

  it('throws 401 when token is invalid', async () => {
    const event = makeEvent({ token: 'not-a-jwt' });
    try {
      await requireAuth(event);
      throw new Error('expected throw');
    } catch (e) {
      expect((e as Error & { statusCode?: number }).statusCode).toBe(401);
    }
  });

  it('throws 401 when token signature is wrong', async () => {
    const badToken = jwt.sign({ userId: USER_ID }, 'a-different-secret-32-chars-long-okay');
    const event = makeEvent({ token: badToken });
    try {
      await requireAuth(event);
      throw new Error('expected throw');
    } catch (e) {
      expect((e as Error & { statusCode?: number }).statusCode).toBe(401);
    }
  });

  it('throws 401 when token belongs to a deleted user', async () => {
    const token = createAuthToken(OTHER_USER_ID);
    mockDbState.users = { [OTHER_USER_ID]: undefined }; // user not in DB
    mockSelect._setUserId(OTHER_USER_ID);
    const event = makeEvent({ token });
    try {
      await requireAuth(event);
      throw new Error('expected throw');
    } catch (e) {
      expect((e as Error & { statusCode?: number }).statusCode).toBe(401);
    }
  });
});

describe('getOptionalAuth', () => {
  beforeEach(() => {
    mockDbState.users = { [USER_ID]: userRow };
    mockSelect._setUserId(USER_ID);
    vi.stubGlobal('getCookie', (event: any, name: string) => event.cookies?.[name]);
  });

  it('returns null when no cookie', async () => {
    const event = makeEvent();
    const user = await getOptionalAuth(event);
    expect(user).toBeNull();
  });

  it('returns null when token is invalid', async () => {
    const event = makeEvent({ token: 'garbage' });
    const user = await getOptionalAuth(event);
    expect(user).toBeNull();
  });

  it('returns null when token user no longer exists', async () => {
    const token = createAuthToken(OTHER_USER_ID);
    mockDbState.users = { [OTHER_USER_ID]: undefined };
    mockSelect._setUserId(OTHER_USER_ID);
    const event = makeEvent({ token });
    const user = await getOptionalAuth(event);
    expect(user).toBeNull();
  });

  it('returns user (without passwordHash) when token is valid', async () => {
    const token = createAuthToken(USER_ID);
    const event = makeEvent({ token });
    const user = await getOptionalAuth(event);
    expect(user).not.toBeNull();
    expect(user?.id).toBe(USER_ID);
    expect((user as Record<string, unknown>)?.passwordHash).toBeUndefined();
  });
});
