/**
 * Tests for server/api/songs/index.post.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

const requireAuthMock = vi.fn();
vi.mock('../../utils/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

const applyRateLimitMock = vi.fn(async () => undefined);
const checkRateLimitMock = vi.fn(() => undefined);
const getRateLimitKeyMock = vi.fn(async (_e: unknown, ns: string) => `${ns}:test`);
vi.mock('../../utils/rate-limit', () => ({
  applyRateLimit: (...args: unknown[]) => applyRateLimitMock(...args),
  checkRateLimit: (...args: unknown[]) => checkRateLimitMock(...args),
  getRateLimitKey: (...args: unknown[]) => getRateLimitKeyMock(...args),
}));

vi.mock('../../db', () => ({ db: {} }));

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

import songsPost from './index.post';

const SAMPLE_SONG = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Sample',
  artist: null,
  difficulty: 'beginner',
  instrumentType: 'guitar',
  format: 'alphatex',
  notationData: '{}',
  metadata: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/songs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => ({ id: 'u-1' }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await songsPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { title: 'x' };
    const res = await songsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid difficulty', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {
      title: 'x',
      difficulty: 'guru',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '{}',
    };
    const res = await songsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid instrumentType', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {
      title: 'x',
      difficulty: 'beginner',
      instrumentType: 'ukulele',
      format: 'alphatex',
      notationData: '{}',
    };
    const res = await songsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = {
      title: 'x',
      difficulty: 'beginner',
      instrumentType: 'guitar',
      format: 'scribble',
      notationData: '{}',
    };
    const res = await songsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 on happy path', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_SONG] }));
    nextBody = {
      title: 'Sample',
      difficulty: 'beginner',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '{}',
    };
    const res = await songsPost(makeEvent());
    expect(res.id).toBe(SAMPLE_SONG.id);
  });

  it('accepts optional artist and metadata', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_SONG] }));
    nextBody = {
      title: 'Sample',
      artist: 'An Artist',
      difficulty: 'beginner',
      instrumentType: 'guitar',
      format: 'alphatex',
      notationData: '{}',
      metadata: { key: 'value' },
    };
    const res = await songsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });
});
