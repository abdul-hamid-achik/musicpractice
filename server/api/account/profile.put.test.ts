/**
 * Tests for server/api/account/profile.put.ts
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

import profileHandler from './profile.put';

const SAMPLE_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'a@b.com',
  username: 'alpha',
  name: 'Alpha',
  avatarUrl: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  passwordHash: 'h',
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

describe('PUT /api/account/profile', () => {
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
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when no fields are provided', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {};
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { email: 'not-an-email' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
    expect((res.data as { details?: { email?: string[] } }).details?.email).toBeTruthy();
  });

  it('returns 400 for too-short username', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { username: 'ab' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for too-long username', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { username: 'a'.repeat(31) };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for username with invalid characters', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { username: 'a@b' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for too-long name', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'a'.repeat(51) };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for empty name', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: '' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 when email is already in use', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ id: 'other-user' }] }));
    nextBody = { email: 'other@b.com' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(409);
  });

  it('returns 409 when username is already in use', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [{ id: 'other-user' }] }));
    nextBody = { username: 'beta' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(409);
  });

  it('returns 200 with safe user (no passwordHash) on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [],
        updateReturning: [{ ...SAMPLE_USER, name: 'Renamed' }],
      }),
    );
    nextBody = { name: 'Renamed' };
    const res = await profileHandler(makeEvent());
    expect(res.name).toBe('Renamed');
    expect((res as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('skips email uniqueness check when email is unchanged', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ id: 'should-not-be-checked' }], // would 409 if checked
        updateReturning: [{ ...SAMPLE_USER, email: SAMPLE_USER.email }],
      }),
    );
    nextBody = { email: SAMPLE_USER.email };
    const res = await profileHandler(makeEvent());
    expect(res.email).toBe(SAMPLE_USER.email);
  });

  it('skips username uniqueness check when username is unchanged', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [{ id: 'should-not-be-checked' }],
        updateReturning: [{ ...SAMPLE_USER, username: SAMPLE_USER.username }],
      }),
    );
    nextBody = { username: SAMPLE_USER.username };
    const res = await profileHandler(makeEvent());
    expect(res.username).toBe(SAMPLE_USER.username);
  });

  it('returns 500 when update returns nothing', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({
        selectLimit: [],
        updateReturning: [],
      }),
    );
    nextBody = { name: 'New' };
    const res = await profileHandler(makeEvent());
    expect(res.statusCode).toBe(500);
  });
});
