/**
 * Tests for server/api/songs/[id].get.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeDrizzleMock } from '../_test-helpers';

const useDbMock = vi.fn();
vi.stubGlobal('useDb', useDbMock);

vi.mock('../../db', () => ({ db: {} }));

import songGet from './[id].get';

const VALID_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_SONG = {
  id: VALID_ID,
  title: 'Sample',
  artist: 'Artist',
  difficulty: 'beginner',
  instrumentType: 'guitar',
  format: 'alphatex',
  notationData: '{}',
  metadata: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
};

function makeEvent(id: string | null = VALID_ID): any {
  return {
    context: { params: id !== null ? { id } : {} },
    node: { req: {}, res: {} },
    headers: new Headers(),
    cookies: {},
  };
}

describe('GET /api/songs/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing id', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await songGet(makeEvent(null));
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid UUID format', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock());
    const res = await songGet(makeEvent('not-a-uuid'));
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when song does not exist', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [] }));
    const res = await songGet(makeEvent());
    expect(res.statusCode).toBe(404);
  });

  it('returns 200 with song on success', async () => {
    useDbMock.mockReturnValue(makeDrizzleMock({ selectLimit: [SAMPLE_SONG] }));
    const res = await songGet(makeEvent());
    expect(res.id).toBe(VALID_ID);
    expect(res.title).toBe('Sample');
  });
});
