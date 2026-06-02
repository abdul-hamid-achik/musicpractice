/**
 * Tests for server/api/metronome-presets/index.post.ts
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

let nextBody: any = {};
(globalThis as any).readBody = vi.fn(async () => nextBody);

import presetsPost from './index.post';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_PRESET = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: USER_ID,
  name: 'Slow Blues',
  tempoBpm: 80,
  beatsPerMeasure: 4,
  beatUnit: 4,
  accentPattern: null,
  subdivision: 1,
};

function makeEvent(): any {
  return { context: {}, node: { req: {}, res: {} }, headers: new Headers(), cookies: {} };
}

describe('POST /api/metronome-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextBody = {};
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when name is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { tempoBpm: 80 };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when tempoBpm is missing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Slow' };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-integer tempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Slow', tempoBpm: 80.5 };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive tempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Slow', tempoBpm: 0 };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive beatsPerMeasure', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Slow', tempoBpm: 80, beatsPerMeasure: 0 };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive beatUnit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Slow', tempoBpm: 80, beatUnit: -1 };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive subdivision', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { name: 'Slow', tempoBpm: 80, subdivision: 0 };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 201 on happy path with defaults', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_PRESET] }));
    nextBody = { name: 'Slow Blues', tempoBpm: 80 };
    const res = await presetsPost(makeEvent());
    expect(res.id).toBe(SAMPLE_PRESET.id);
  });

  it('accepts all optional fields', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ insertReturning: [SAMPLE_PRESET] }));
    nextBody = {
      name: 'Slow Blues',
      tempoBpm: 80,
      beatsPerMeasure: 6,
      beatUnit: 8,
      subdivision: 2,
      accentPattern: [true, false, false, false],
    };
    const res = await presetsPost(makeEvent());
    expect(res.statusCode).toBeUndefined();
  });
});
