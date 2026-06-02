/**
 * Tests for server/utils/db.ts
 *
 * `db.ts` is a 5-line passthrough around the drizzle `db` export. Verify it
 * returns the same singleton every call.
 */
import { describe, it, expect, vi } from 'vitest';

// Capture the imported db via a sentinel so we can compare references
const sentinel = vi.hoisted(() => ({ __sentinel: true }));
vi.mock('../db', () => ({ db: sentinel }));

import { useDb } from './db';

describe('useDb', () => {
  it('returns the same db singleton on every call', () => {
    const a = useDb();
    const b = useDb();
    expect(a).toBe(b);
    expect(a).toBe(sentinel);
  });
});
