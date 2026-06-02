/**
 * Tests for server/api/metronome-presets/index.get.ts
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

import presetsGet from './index.get';

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

describe('GET /api/metronome-presets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockImplementation(async () => ({ id: USER_ID }));
  });

  it('returns 401 when not authenticated', async () => {
    const err = new Error('auth') as Error & { statusCode?: number };
    err.statusCode = 401;
    requireAuthMock.mockImplementationOnce(async () => {
      throw err;
    });
    const res = await presetsGet(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with paginated presets', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 1 }], [SAMPLE_PRESET]] }));
    const res = await presetsGet(makeEvent());
    expect(res.data).toEqual([SAMPLE_PRESET]);
    expect(res.total).toBe(1);
  });

  it('respects page and limit query params', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectQueue: [[{ count: 0 }], []] }));
    const event = {
      context: {},
      node: { req: {}, res: {} },
      headers: new Headers(),
      cookies: {},
    } as any;
    (globalThis as any).getQuery = () => ({ page: '2', limit: '10' });
    const res = await presetsGet(event);
    expect(res.page).toBe(2);
    expect(res.limit).toBe(10);
  });
});
