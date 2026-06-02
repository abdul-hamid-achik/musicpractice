/**
 * Tests for server/api/auth/register.post.ts
 *
 * The handler reads from the request body, rate-limits, validates fields,
 * checks the DB for duplicates, inserts a user, hashes the password, and
 * sets an auth cookie. We mock `db` (drizzle client), `auth` (token +
 * cookie helpers), and `rate-limit`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Mocks: drizzle chain ----
const insertChain: Record<string, unknown> = {};
insertChain.values = vi.fn(() => insertChain);
insertChain.returning = vi.fn(async () => []);

const dbMock: Record<string, any> = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  insert: vi.fn(() => insertChain),
};
// The select → from → where → limit chain returns from .limit
dbMock.select.mockImplementation(() => dbMock);
dbMock.from.mockImplementation(() => dbMock);
dbMock.where.mockImplementation(() => dbMock);

vi.mock('../../db', () => ({ db: dbMock }));

const setAuthCookieMock = vi.fn();
const createAuthTokenMock = vi.fn(() => 'TOKEN');
const checkRateLimitMock = vi.fn();

vi.mock('../../utils/auth', () => ({
  createAuthToken: (...args: unknown[]) => createAuthTokenMock(...args),
  setAuthCookie: (...args: unknown[]) => setAuthCookieMock(...args),
  clearAuthCookie: vi.fn(),
}));

vi.mock('../../utils/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
}));

import registerHandler from './register.post';

// `useDb` is globally stubbed in tests/setup.ts — point it at the drizzle mock.
vi.stubGlobal('useDb', () => dbMock);

const SAMPLE_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'a@b.com',
  username: 'alpha',
  passwordHash: 'hashed',
  name: 'Alpha',
  avatarUrl: null,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return {
    context: {},
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    // Default: select-chain → no existing user
    dbMock.limit.mockImplementation(async () => [] as any);
    // Default: insert returns the new user
    insertChain.returning.mockImplementation(async () => [SAMPLE_USER] as any);
  });

  it('returns 400 when fields are missing', async () => {
    nextBody = {};
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect((res.data as { message: string }).message).toMatch(/required/);
  });

  it('returns 400 when email is invalid', async () => {
    nextBody = { email: 'not-an-email', username: 'alpha', password: 'pass1234', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect((res.data as { message: string }).message).toMatch(/email/i);
  });

  it('returns 400 when username is too short', async () => {
    nextBody = { email: 'a@b.com', username: 'ab', password: 'pass1234', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect((res.data as { message: string }).message).toMatch(/username/i);
  });

  it('returns 400 when username is too long', async () => {
    nextBody = { email: 'a@b.com', username: 'a'.repeat(31), password: 'pass1234', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when password is too short', async () => {
    nextBody = { email: 'a@b.com', username: 'alpha', password: 'short', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect((res.data as { message: string }).message).toMatch(/password/i);
  });

  it('returns 409 when user with same email or username already exists', async () => {
    dbMock.limit.mockImplementation(async () => [{ id: 'existing' }] as any);
    nextBody = { email: 'a@b.com', username: 'alpha', password: 'pass1234', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(409);
  });

  it('returns 201 on happy path with the user (no passwordHash) and sets cookie', async () => {
    dbMock.limit.mockImplementation(async () => [] as any);
    insertChain.returning.mockImplementation(async () => [SAMPLE_USER] as any);
    nextBody = { email: 'a@b.com', username: 'alpha', password: 'pass1234', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.id).toBe(SAMPLE_USER.id);
    expect((res as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(setAuthCookieMock).toHaveBeenCalled();
    expect(createAuthTokenMock).toHaveBeenCalledWith(SAMPLE_USER.id);
  });

  it('returns 500 when insert returns no user', async () => {
    dbMock.limit.mockImplementation(async () => [] as any);
    insertChain.returning.mockImplementation(async () => [] as any);
    nextBody = { email: 'a@b.com', username: 'alpha', password: 'pass1234', name: 'A' };
    const res = await registerHandler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
