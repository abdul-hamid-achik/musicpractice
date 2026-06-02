/**
 * Tests for server/api/scales/[id].get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

import scaleGet from './[id].get';

const VALID_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_SCALE = {
  id: VALID_ID,
  name: 'Major',
  intervals: [0, 2, 4, 5, 7, 9, 11],
  category: 'diatonic',
  description: 'The major scale.',
};

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('GET /api/scales/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await scaleGet(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await scaleGet(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when scale does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await scaleGet(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 on success', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_SCALE] }));
    const res = await scaleGet(makeEvent());
    expect(res.id).toBe(VALID_ID);
    expect(res.name).toBe('Major');
  });
});
