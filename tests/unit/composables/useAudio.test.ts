import { describe, it, expect, vi, beforeEach } from 'vitest';

// useAudio does `await import('tone')` for both start() and getContext().
// We replace the tone module entirely so both paths are observable.
const toneMock = {
  start: vi.fn().mockResolvedValue(undefined),
  getContext: vi.fn(() => ({
    state: 'running',
    currentTime: 1234.5,
    rawContext: { state: 'running' },
  })),
};

vi.mock('tone', () => toneMock);

import { useAudio } from '~/composables/useAudio';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAudio', () => {
  it('starts with isReady = false', () => {
    const { isReady } = useAudio();
    expect(isReady.value).toBe(false);
  });

  it('start() sets isReady to true after Tone.start resolves', async () => {
    const { isReady, start } = useAudio();
    expect(isReady.value).toBe(false);

    await start();

    expect(isReady.value).toBe(true);
    expect(toneMock.start).toHaveBeenCalledTimes(1);
  });

  it('start() is idempotent — calling again still leaves isReady true', async () => {
    const { isReady, start } = useAudio();
    await start();
    expect(isReady.value).toBe(true);

    await start();
    expect(isReady.value).toBe(true);
    expect(toneMock.start).toHaveBeenCalledTimes(2);
  });

  it('getContext returns Tone.getContext result', async () => {
    const { getContext } = useAudio();
    const ctx = await getContext();

    expect(ctx).toBe(toneMock.getContext.mock.results[0]!.value);
    expect(toneMock.getContext).toHaveBeenCalledTimes(1);
  });

  it('does not call Tone.start before start() is invoked', () => {
    useAudio();
    expect(toneMock.start).not.toHaveBeenCalled();
  });
});
