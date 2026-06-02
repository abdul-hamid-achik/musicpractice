/**
 * Tests for server/api/metronome-presets/[id].delete.ts
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

import presetDelete from './[id].delete';

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

describe('DELETE /api/metronome-presets/:id', () => {
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
    const res = await presetDelete(makeEvent());
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await presetDelete(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await presetDelete(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when preset does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ deleteReturning: [] }));
    const res = await presetDelete(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ deleteReturning: [{ id: VALID_ID }] }));
    const res = await presetDelete(makeEvent());
    expect(res.message).toMatch(/deleted/);
    expect(res.id).toBe(VALID_ID);
  });
});
