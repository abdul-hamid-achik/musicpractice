/**
 * Tests for server/utils/rate-limit.ts
 *
 * The module uses a module-level `Map` + `setInterval(cleanupRateLimitStore, 60_000)`.
 * We can't directly reset the Map (no exported reset hook), so each test uses
 * a unique key to stay isolated.
 *
 * `rate-limit.ts` imports `createError` from `h3` directly, so the thrown error
 * is a real H3Error (not the tests/setup.ts stub).
 */
import { describe, it, expect, vi } from 'vitest';
import { H3Error } from 'h3';
import {
  checkRateLimit,
  cleanupRateLimitStore,
  getRateLimitKey,
  applyRateLimit,
} from './rate-limit';

const SECRET = 'test-jwt-secret-at-least-32-characters-long-for-tests';

function asH3(e: unknown): H3Error {
  return e as H3Error;
}

describe('checkRateLimit', () => {
  it('first call does not throw', () => {
    expect(() => checkRateLimit(`test:first:${Math.random()}`)).not.toThrow();
  });

  it('counts up to max and then throws 429', () => {
    const key = `test:max:${Math.random()}`;
    // default max is 10 — 10 calls pass, 11th throws
    for (let i = 0; i < 10; i++) {
      expect(() => checkRateLimit(key)).not.toThrow();
    }
    try {
      checkRateLimit(key);
      throw new Error('expected to throw');
    } catch (e) {
      expect(asH3(e).statusCode).toBe(429);
    }
  });

  it('respects a custom max', () => {
    const key = `test:custom:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(() => checkRateLimit(key, 3)).not.toThrow();
    }
    try {
      checkRateLimit(key, 3);
      throw new Error('expected to throw');
    } catch (e) {
      expect(asH3(e).statusCode).toBe(429);
    }
  });

  it('keeps throwing 429 after the limit is exceeded', () => {
    const key = `test:persist:${Math.random()}`;
    // Burn through the budget
    for (let i = 0; i < 10; i++) checkRateLimit(key);
    // Now every subsequent call throws
    for (let i = 0; i < 3; i++) {
      try {
        checkRateLimit(key);
        throw new Error('expected to throw');
      } catch (e) {
        expect(asH3(e).statusCode).toBe(429);
      }
    }
  });

  it('different keys are independent', () => {
    const keyA = `test:A:${Math.random()}`;
    const keyB = `test:B:${Math.random()}`;
    for (let i = 0; i < 10; i++) checkRateLimit(keyA);
    // keyA is exhausted but keyB starts fresh
    expect(() => checkRateLimit(keyB)).not.toThrow();
    expect(() => checkRateLimit(keyB)).not.toThrow();
  });

  it('resets the counter when the window has expired', () => {
    const key = `test:expiry:${Math.random()}`;
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 10; i++) checkRateLimit(key);
      try {
        checkRateLimit(key);
        throw new Error('expected to throw');
      } catch (e) {
        expect(asH3(e).statusCode).toBe(429);
      }
      vi.advanceTimersByTime(61_000);
      // window has expired — the next call should reset the counter
      expect(() => checkRateLimit(key)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('cleanupRateLimitStore', () => {
  it('removes expired entries', () => {
    const key = `test:cleanup:${Math.random()}`;
    vi.useFakeTimers();
    try {
      checkRateLimit(key);
      vi.advanceTimersByTime(120_000);
      cleanupRateLimitStore();
      // After cleanup the entry is gone, so this is a fresh "first call"
      expect(() => checkRateLimit(key)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it('is safe to call when the store is empty', () => {
    expect(() => cleanupRateLimitStore()).not.toThrow();
  });
});

describe('getRateLimitKey', () => {
  it('returns namespace:ip:<ip> when no auth cookie present', async () => {
    vi.stubGlobal('getCookie', () => undefined);
    vi.stubGlobal('getRequestIP', () => '203.0.113.5');
    const event: any = { context: {}, node: { req: {}, res: {} } };
    const key = await getRateLimitKey(event, 'login');
    expect(key).toBe('login:ip:203.0.113.5');
  });

  it('falls back to "unknown" when no IP is available', async () => {
    vi.stubGlobal('getCookie', () => undefined);
    vi.stubGlobal('getRequestIP', () => undefined);
    const event: any = { context: {}, node: { req: {}, res: {} } };
    const key = await getRateLimitKey(event, 'register');
    expect(key).toBe('register:ip:unknown');
  });

  it('returns namespace:user:<id> when auth cookie resolves to a user', async () => {
    // Build a valid JWT for a known user id
    const jwt = await import('jsonwebtoken');
    const USER_ID = '33333333-3333-3333-3333-333333333333';
    const token = jwt.default.sign({ userId: USER_ID }, SECRET);

    vi.stubGlobal('getCookie', (_e: unknown, _n: string) => token);

    // Mock db lookup to return a user
    const dbMock = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [
              {
                id: USER_ID,
                email: 'x@x',
                username: 'u',
                name: 'U',
                avatarUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                passwordHash: 'h',
              },
            ],
          }),
        }),
      }),
    };
    vi.doMock('../db', () => ({ db: dbMock }));
    // Re-import getRateLimitKey with the mock applied
    vi.resetModules();
    const mod = await import('./rate-limit');
    const event: any = { context: {}, node: { req: {}, res: {} } };
    const key = await mod.getRateLimitKey(event, 'login');
    expect(key).toBe(`login:user:${USER_ID}`);
  });
});

describe('applyRateLimit', () => {
  it('builds a key and increments the counter (no throw for a single call)', async () => {
    vi.stubGlobal('getCookie', () => undefined);
    vi.stubGlobal('getRequestIP', () => '198.51.100.1');
    const event: any = { context: {}, node: { req: {}, res: {} } };
    await expect(applyRateLimit(event, 'apply-test')).resolves.toBeUndefined();
  });

  it('throws 429 after the limit is reached', async () => {
    vi.stubGlobal('getCookie', () => undefined);
    vi.stubGlobal('getRequestIP', () => '198.51.100.2');
    const event: any = { context: {}, node: { req: {}, res: {} } };
    for (let i = 0; i < 10; i++) await applyRateLimit(event, 'apply-test-2');
    await expect(applyRateLimit(event, 'apply-test-2')).rejects.toMatchObject({ statusCode: 429 });
  });
});
