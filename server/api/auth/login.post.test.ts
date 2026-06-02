/**
 * Tests for server/api/auth/login.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock bcrypt at the module level so we can control compare() / hash()
const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn(async () => 'hashed'),
  compare: vi.fn(async () => false),
}));
vi.mock('bcrypt', () => ({ default: bcryptMock, ...bcryptMock }));

const dbMock: Record<string, any> = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
};
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

import loginHandler from './login.post';
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
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    bcryptMock.compare.mockImplementation(async () => false);
  });

  it('returns 400 when identifier or password are missing', async () => {
    nextBody = {};
    const res = await loginHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when only identifier is provided', async () => {
    nextBody = { identifier: 'a@b.com' };
    const res = await loginHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 when user is not found', async () => {
    dbMock.limit.mockImplementation(async () => [] as any);
    nextBody = { identifier: 'nope@x.com', password: 'whatever' };
    const res = await loginHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 when password is wrong', async () => {
    dbMock.limit.mockImplementation(async () => [SAMPLE_USER] as any);
    bcryptMock.compare.mockImplementation(async () => false);
    nextBody = { identifier: 'a@b.com', password: 'wrongpassword' };
    const res = await loginHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with user (no passwordHash) on success via email', async () => {
    dbMock.limit.mockImplementation(async () => [SAMPLE_USER] as any);
    bcryptMock.compare.mockImplementation(async () => true);
    nextBody = { identifier: 'a@b.com', password: 'correctpassword' };
    const res = await loginHandler(makeEvent());
    expect(res.id).toBe(SAMPLE_USER.id);
    expect((res as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(setAuthCookieMock).toHaveBeenCalled();
    expect(createAuthTokenMock).toHaveBeenCalledWith(SAMPLE_USER.id);
  });

  it('returns 200 with user on success via username', async () => {
    dbMock.limit.mockImplementation(async () => [SAMPLE_USER] as any);
    bcryptMock.compare.mockImplementation(async () => true);
    nextBody = { identifier: 'alpha', password: 'correctpassword' };
    const res = await loginHandler(makeEvent());
    expect(res.id).toBe(SAMPLE_USER.id);
  });
});
