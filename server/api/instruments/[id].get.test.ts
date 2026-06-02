/**
 * Tests for server/api/instruments/[id].get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

import instrumentGet from './[id].get';

const VALID_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_INSTRUMENT = {
  id: VALID_ID,
  name: 'Acoustic Guitar',
  type: 'guitar',
  tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
  stringCount: 6,
  fretCount: 22,
  isDefault: true,
};

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('GET /api/instruments/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await instrumentGet(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await instrumentGet(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when instrument does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await instrumentGet(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_INSTRUMENT] }));
    const res = await instrumentGet(makeEvent());
    expect(res.id).toBe(VALID_ID);
    expect(res.name).toBe('Acoustic Guitar');
  });
});
