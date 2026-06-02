/**
 * Tests for server/api/account/change-password.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn(async () => 'hashed'),
  compare: vi.fn(async () => false),
}));
vi.mock('bcrypt', () => ({ default: bcryptMock, ...bcryptMock }));

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
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

vi.mock('../../db', () => ({ db: {} }));

import changePwdHandler from './change-password.post';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_USER = {
  id: USER_ID,
  email: 'a@b.com',
  username: 'alpha',
  passwordHash: 'hashed',
  name: 'Alpha',
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

describe('POST /api/account/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
    bcryptMock.compare.mockImplementation(async () => true);
    bcryptMock.hash.mockImplementation(async () => 'new-hashed');
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await changePwdHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when passwords are missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {};
    const res = await changePwdHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when new password is too short', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { currentPassword: 'old1234', newPassword: 'short' };
    const res = await changePwdHandler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect(
      (res.data as { details?: { newPassword?: string[] } }).details?.newPassword,
    ).toBeTruthy();
  });

  it('returns 404 when current user not found in DB', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    nextBody = { currentPassword: 'old1234', newPassword: 'new12345' };
    const res = await changePwdHandler(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 401 when current password is wrong', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_USER] }));
    bcryptMock.compare.mockImplementation(async () => false);
    nextBody = { currentPassword: 'old1234', newPassword: 'new12345' };
    const res = await changePwdHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [SAMPLE_USER],
        updateReturning: [{ id: USER_ID }],
      }),
    );
    nextBody = { currentPassword: 'old1234', newPassword: 'new12345' };
    const res = await changePwdHandler(makeEvent());
    expect(res.success).toBe(true);
    expect(bcryptMock.hash).toHaveBeenCalledWith('new12345', 10);
  });

  it('returns 500 when update returns nothing', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [SAMPLE_USER],
        updateReturning: [],
      }),
    );
    nextBody = { currentPassword: 'old1234', newPassword: 'new12345' };
    const res = await changePwdHandler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
