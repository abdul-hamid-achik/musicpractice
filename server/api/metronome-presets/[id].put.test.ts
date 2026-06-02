/**
 * Tests for server/api/metronome-presets/[id].put.ts
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

import presetPut from './[id].put';

const VALID_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('PUT /api/metronome-presets/:id', () => {
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
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await presetPut(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await presetPut(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive tempoBpm', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { tempoBpm: 0 };
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive beatsPerMeasure', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { beatsPerMeasure: 0 };
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive beatUnit', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { beatUnit: 0 };
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for non-positive subdivision', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { subdivision: 0 };
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when no valid fields provided', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    nextBody = { unknownField: 'x' };
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(400);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(
      makeDrizzleMock({ updateReturning: [{ id: VALID_ID, name: 'Renamed' }] }),
    );
    nextBody = { name: 'Renamed' };
    const res = await presetPut(makeEvent());
    expect(res.name).toBe('Renamed');
  });

  it('returns 404 when update returns nothing', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ updateReturning: [] }));
    nextBody = { name: 'Renamed' };
    const res = await presetPut(makeEvent());
    expect(res.statusCode).toBe(404);
  });
});
