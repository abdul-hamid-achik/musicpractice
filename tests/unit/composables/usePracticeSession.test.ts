import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { usePracticeSession } from '~/composables/usePracticeSession';

/**
 * usePracticeSession
 *  - Wraps session lifecycle (start / pause / resume / stop) with a
 *    setInterval-based elapsed timer, localStorage persistence, and
 *    an audit-and-recover flow for stale sessions.
 *  - Calls $fetch('/api/sessions', { method: 'POST', body }) on save.
 *
 * The composable installs a `beforeunload` listener and a `setInterval`
 * timer on mount. We use `vi.useFakeTimers()` to control the interval
 * and to fast-forward the debounced persistence (5s).
 */

const STORAGE_KEY = 'musicpractice-active-session';

/** $fetch mock — the composable POSTs to /api/sessions when saving. */
const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ id: 'saved-1' });
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

/**
 * Mount the composable in a tiny component so its `onBeforeUnmount` runs
 * and we get a stable wrapper for assertions.
 */
function mountSession() {
  const wrapper = mount(
    defineComponent({
      setup() {
        const session = usePracticeSession();
        return { session };
      },
      render() {
        return h('div');
      },
    }),
    { attachTo: document.body },
  );
  return {
    wrapper,
    session: (wrapper.vm as any).session as ReturnType<typeof usePracticeSession>,
  };
}

// =================================================================
// State transitions
// =================================================================

describe('usePracticeSession — state transitions', () => {
  it('starts inactive', () => {
    const { session } = mountSession();
    expect(session.isActive.value).toBe(false);
    expect(session.isPaused.value).toBe(false);
    expect(session.elapsed.value).toBe(0);
    expect(session.currentSession.value).toBeNull();
  });

  it('startSession sets isActive, resets elapsed, starts timer', () => {
    const { session } = mountSession();
    session.startSession('guitar-1', 120, 'song-1');

    expect(session.isActive.value).toBe(true);
    expect(session.isPaused.value).toBe(false);
    expect(session.elapsed.value).toBe(0);
    expect(session.currentSession.value).toEqual({
      instrumentId: 'guitar-1',
      songId: 'song-1',
      tempoBpm: 120,
    });
  });

  it('elapsed ticks every second when running', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    expect(session.elapsed.value).toBe(0);

    vi.advanceTimersByTime(1000);
    expect(session.elapsed.value).toBe(1);

    vi.advanceTimersByTime(2000);
    expect(session.elapsed.value).toBe(3);
  });

  it('pauseSession stops the timer and freezes elapsed', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');

    vi.advanceTimersByTime(3000);
    expect(session.elapsed.value).toBe(3);

    session.pauseSession();
    expect(session.isPaused.value).toBe(true);
    const elapsedAtPause = session.elapsed.value;

    vi.advanceTimersByTime(5000);
    expect(session.elapsed.value).toBe(elapsedAtPause);
  });

  it('pauseSession is a no-op when not active', () => {
    const { session } = mountSession();
    session.pauseSession();
    expect(session.isPaused.value).toBe(false);
  });

  it('pauseSession is a no-op when already paused', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    session.pauseSession();
    const elapsedAtPause = session.elapsed.value;
    session.pauseSession(); // second call
    expect(session.elapsed.value).toBe(elapsedAtPause);
  });

  it('resumeSession un-pauses and resumes the timer (cumulative elapsed)', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    vi.advanceTimersByTime(2000);
    expect(session.elapsed.value).toBe(2);

    session.pauseSession();
    vi.advanceTimersByTime(10000); // 10s while paused — should NOT count
    expect(session.elapsed.value).toBe(2);

    session.resumeSession();
    expect(session.isPaused.value).toBe(false);
    vi.advanceTimersByTime(3000);
    expect(session.elapsed.value).toBe(5); // 2 + 3
  });

  it('resumeSession is a no-op when not active or not paused', () => {
    const { session } = mountSession();
    session.resumeSession(); // never started
    expect(session.isActive.value).toBe(false);

    session.startSession('guitar-1');
    session.resumeSession(); // not paused
    expect(session.isPaused.value).toBe(false);
  });

  it('stopSession resets isActive/isPaused and clears the timer', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    vi.advanceTimersByTime(2000);
    session.stopSession();

    expect(session.isActive.value).toBe(false);
    expect(session.isPaused.value).toBe(false);

    // Timer is cleared — advancing time should not re-tick
    vi.advanceTimersByTime(5000);
    expect(session.elapsed.value).toBe(2); // unchanged
  });
});

// =================================================================
// saveSession
// =================================================================

describe('usePracticeSession — saveSession', () => {
  it('POSTs to /api/sessions with the correct body shape', async () => {
    const { session } = mountSession();
    session.startSession('guitar-1', 120, 'song-1');
    vi.advanceTimersByTime(5000);

    const result = await session.saveSession('great session', ['tag-a', 'tag-b']);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0]!;
    expect(url).toBe('/api/sessions');
    expect(opts.method).toBe('POST');
    expect(opts.body.instrumentId).toBe('guitar-1');
    expect(opts.body.songId).toBe('song-1');
    expect(opts.body.tempoBpm).toBe(120);
    expect(opts.body.durationSeconds).toBe(5);
    expect(opts.body.notes).toBe('great session');
    expect(opts.body.tags).toEqual(['tag-a', 'tag-b']);
    expect(typeof opts.body.startedAt).toBe('string');
    expect(typeof opts.body.endedAt).toBe('string');
    expect(result).toEqual({ id: 'saved-1' });
  });

  it('saveSession with no notes/tags sends null notes and empty tags', async () => {
    const { session } = mountSession();
    session.startSession('guitar-1');

    await session.saveSession();

    const body = mockFetch.mock.calls[0]![1]!.body;
    expect(body.notes).toBeNull();
    expect(body.tags).toEqual([]);
  });

  it('saveSession stops the session and clears storage on success', async () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    vi.advanceTimersByTime(1000);

    await session.saveSession();

    expect(session.isActive.value).toBe(false);
    expect(session.elapsed.value).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('saveSession returns null when there is no active session', async () => {
    const { session } = mountSession();
    const result = await session.saveSession();
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// =================================================================
// restoreSession
// =================================================================

describe('usePracticeSession — restoreSession', () => {
  it('restores a stored session and re-applies accumulated seconds', () => {
    const { session } = mountSession();
    const stored = {
      instrumentId: 'piano-1',
      songId: 'song-42',
      tempoBpm: 90,
      startedAt: new Date(Date.now() - 60000).toISOString(),
      accumulatedSeconds: 60,
      isPaused: true,
      lastPersistedAt: new Date().toISOString(),
    };
    session.restoreSession(stored);

    expect(session.isActive.value).toBe(true);
    expect(session.isPaused.value).toBe(true);
    expect(session.elapsed.value).toBe(60);
    expect(session.currentSession.value).toEqual({
      instrumentId: 'piano-1',
      songId: 'song-42',
      tempoBpm: 90,
    });
  });

  it('restoreSession with isPaused=false starts the timer', () => {
    const { session } = mountSession();
    const stored = {
      instrumentId: 'guitar-1',
      startedAt: new Date(Date.now() - 5000).toISOString(),
      accumulatedSeconds: 5,
      isPaused: false,
      lastPersistedAt: new Date().toISOString(),
    };
    session.restoreSession(stored);

    expect(session.isActive.value).toBe(true);
    expect(session.isPaused.value).toBe(false);
    vi.advanceTimersByTime(2000);
    expect(session.elapsed.value).toBe(7);
  });
});

// =================================================================
// getStoredSession
// =================================================================

describe('usePracticeSession — getStoredSession', () => {
  it('returns null when nothing is in localStorage', () => {
    const { session } = mountSession();
    expect(session.getStoredSession()).toBeNull();
  });

  it('parses and returns a valid stored session', () => {
    const { session } = mountSession();
    const data = {
      instrumentId: 'guitar-1',
      startedAt: new Date().toISOString(),
      accumulatedSeconds: 10,
      isPaused: false,
      lastPersistedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const stored = session.getStoredSession();
    expect(stored).toEqual(data);
  });

  it('returns null for invalid JSON', () => {
    const { session } = mountSession();
    localStorage.setItem(STORAGE_KEY, '{ not json');
    expect(session.getStoredSession()).toBeNull();
  });

  it('returns null when instrumentId is missing', () => {
    const { session } = mountSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ startedAt: new Date().toISOString() }));
    expect(session.getStoredSession()).toBeNull();
  });

  it('returns null when startedAt is missing', () => {
    const { session } = mountSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ instrumentId: 'x' }));
    expect(session.getStoredSession()).toBeNull();
  });
});

// =================================================================
// getSessionRecoveryInfo
// =================================================================

describe('usePracticeSession — getSessionRecoveryInfo', () => {
  it('returns null when no stored session', () => {
    const { session } = mountSession();
    expect(session.getSessionRecoveryInfo()).toBeNull();
  });

  it('returns recovery info with age and freshness for a current session', () => {
    const { session } = mountSession();
    const now = new Date();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        instrumentId: 'guitar-1',
        startedAt: now.toISOString(),
        accumulatedSeconds: 5,
        isPaused: false,
        lastPersistedAt: now.toISOString(),
      }),
    );

    const info = session.getSessionRecoveryInfo()!;
    expect(info).not.toBeNull();
    expect(info.session.instrumentId).toBe('guitar-1');
    expect(info.isStale).toBe(false);
    expect(info.isFromCurrentDay).toBe(true);
    expect(info.age).toBe('just now');
  });

  it('marks a session as stale when older than 24h', () => {
    const { session } = mountSession();
    const longAgo = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        instrumentId: 'guitar-1',
        startedAt: longAgo.toISOString(),
        accumulatedSeconds: 5,
        isPaused: false,
        lastPersistedAt: longAgo.toISOString(),
      }),
    );

    const info = session.getSessionRecoveryInfo()!;
    expect(info.isStale).toBe(true);
  });

  it('formats age in hours for sessions 1-24h old', () => {
    const { session } = mountSession();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        instrumentId: 'guitar-1',
        startedAt: twoHoursAgo.toISOString(),
        accumulatedSeconds: 5,
        isPaused: false,
        lastPersistedAt: twoHoursAgo.toISOString(),
      }),
    );

    const info = session.getSessionRecoveryInfo()!;
    expect(info.age).toMatch(/hour/);
  });
});

// =================================================================
// clearStaleSessions
// =================================================================

describe('usePracticeSession — clearStaleSessions', () => {
  it('returns false and clears nothing when no session is stored', () => {
    const { session } = mountSession();
    expect(session.clearStaleSessions()).toBe(false);
  });

  it('returns false for a fresh session', () => {
    const { session } = mountSession();
    const now = new Date();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        instrumentId: 'guitar-1',
        startedAt: now.toISOString(),
        accumulatedSeconds: 5,
        isPaused: false,
        lastPersistedAt: now.toISOString(),
      }),
    );
    expect(session.clearStaleSessions()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('returns true and clears storage for a stale session', () => {
    const { session } = mountSession();
    const longAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        instrumentId: 'guitar-1',
        startedAt: longAgo.toISOString(),
        accumulatedSeconds: 5,
        isPaused: false,
        lastPersistedAt: longAgo.toISOString(),
      }),
    );
    expect(session.clearStaleSessions()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

// =================================================================
// Storage errors
// =================================================================

describe('usePracticeSession — storage error handling', () => {
  // The test setup stubs `localStorage` with a MapStorage instance from
  // tests/setup.ts. We override its `setItem` to throw specific errors.
  function withSetItem(impl: () => void, fn: () => void) {
    const original = localStorage.setItem.bind(localStorage);
    localStorage.setItem = vi.fn(impl) as any;
    try {
      fn();
    } finally {
      localStorage.setItem = original as any;
    }
  }

  it('sets storageError and continues when localStorage.setItem throws QuotaExceededError', () => {
    const { session } = mountSession();
    withSetItem(
      () => {
        throw new DOMException('quota exceeded', 'QuotaExceededError');
      },
      () => {
        session.startSession('guitar-1');
        // Advance so the timer ticks schedule a debounced persist
        vi.advanceTimersByTime(2000);
        // Pause triggers an immediate flush
        session.pauseSession();
        expect(session.storageError.value).toMatch(/quota/i);
      },
    );
  });

  it('sets storageError when localStorage.setItem throws SecurityError', () => {
    const { session } = mountSession();
    withSetItem(
      () => {
        throw new DOMException('security', 'SecurityError');
      },
      () => {
        session.startSession('guitar-1');
        vi.advanceTimersByTime(2000);
        session.pauseSession();
        expect(session.storageError.value).toMatch(/unavailable|private browsing/i);
      },
    );
  });

  it('sets a generic storageError for unknown DOMException', () => {
    const { session } = mountSession();
    withSetItem(
      () => {
        throw new DOMException('mystery', 'SomethingElse');
      },
      () => {
        session.startSession('guitar-1');
        vi.advanceTimersByTime(2000);
        session.pauseSession();
        expect(session.storageError.value).toMatch(/storage error/i);
      },
    );
  });

  it('clears storageError after a subsequent successful write', () => {
    const { session } = mountSession();
    let shouldThrow = true;
    withSetItem(
      () => {
        if (shouldThrow) throw new DOMException('quota', 'QuotaExceededError');
      },
      () => {
        session.startSession('guitar-1');
        vi.advanceTimersByTime(2000);
        session.pauseSession();
        expect(session.storageError.value).toMatch(/quota/i);

        // Now let writes succeed
        shouldThrow = false;
        // Force a new persistence cycle by pausing again
        session.resumeSession();
        vi.advanceTimersByTime(2000);
        session.pauseSession();
        expect(session.storageError.value).toBeNull();
      },
    );
  });
});

// =================================================================
// Persistence behavior (debounced)
// =================================================================

describe('usePracticeSession — persistence', () => {
  /**
   * The composable's `setInterval` ticks every 1s and calls
   * `debouncedPersist()` on each tick. Because the debounce is reset on
   * every call, the actual `localStorage.setItem` only happens when we
   * either (a) explicitly flush (via `pauseSession`) or (b) stop the timer
   * (via `stopSession` / `saveSession`).
   *
   * We use `pauseSession` to trigger an immediate flush in the
   * happy-path tests, which exercises the same `safeSetStorage` →
   * `localStorage.setItem` pipeline.
   */

  it('writes session data to localStorage when the debounce flushes', () => {
    const { session } = mountSession();
    session.startSession('guitar-1', 100);

    // Advance time so the timer's first tick schedules a debounced persist
    vi.advanceTimersByTime(2000);

    // Before any flush, nothing is persisted
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Pause triggers an immediate flush
    session.pauseSession();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.instrumentId).toBe('guitar-1');
    expect(stored.tempoBpm).toBe(100);
    expect(stored.isPaused).toBe(true);
    expect(stored.accumulatedSeconds).toBe(2);
  });

  it('persists on first change from initial state (start + pause flushes)', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');

    // Advance one tick so a debounced persist is scheduled
    vi.advanceTimersByTime(1000);

    // Pause flushes — the change from isPaused=false → true is a real change
    session.pauseSession();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.instrumentId).toBe('guitar-1');
    expect(stored.isPaused).toBe(true);
  });

  it('pauseSession immediately flushes pending persistence', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    vi.advanceTimersByTime(2000);

    // Pause triggers a flush
    session.pauseSession();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.isPaused).toBe(true);
  });

  it('stopSession cancels pending debounced writes (no further setItem calls)', () => {
    const { session } = mountSession();
    session.startSession('guitar-1');
    vi.advanceTimersByTime(2000);

    const setItemSpy = vi.fn();
    const original = localStorage.setItem.bind(localStorage);
    localStorage.setItem = setItemSpy as any;

    session.stopSession();
    // No further writes after stop — advance past the debounce window
    vi.advanceTimersByTime(10000);
    expect(setItemSpy).not.toHaveBeenCalled();

    localStorage.setItem = original as any;
  });
});

// =================================================================
// Lifecycle
// =================================================================

describe('usePracticeSession — lifecycle', () => {
  it('cleans up the beforeunload listener and timer on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { session, wrapper } = mountSession();
    session.startSession('guitar-1');
    vi.advanceTimersByTime(1000);

    wrapper.unmount();

    // beforeunload listener should be removed
    const beforeunloadRemoved = removeSpy.mock.calls.some((call) => call[0] === 'beforeunload');
    expect(beforeunloadRemoved).toBe(true);

    // After unmount, advancing the timer must not crash and must not
    // touch elapsed.
    const before = session.elapsed.value;
    vi.advanceTimersByTime(5000);
    expect(session.elapsed.value).toBe(before);

    removeSpy.mockRestore();
  });

  it('beforeunload prompts the user when a session is active', () => {
    const preventDefault = vi.fn();
    mountSession();
    const event = new Event('beforeunload', { cancelable: true });
    Object.defineProperty(event, 'preventDefault', { value: preventDefault });
    window.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });
});

// =================================================================
// Helpers exposed on the composable
// =================================================================

describe('usePracticeSession — helpers', () => {
  it('formatTime formats seconds into HH:MM:SS', () => {
    const { session } = mountSession();
    expect(session.formatTime(0)).toBe('00:00:00');
    expect(session.formatTime(59)).toBe('00:00:59');
    expect(session.formatTime(60)).toBe('00:01:00');
    expect(session.formatTime(3600)).toBe('01:00:00');
    expect(session.formatTime(3661)).toBe('01:01:01');
  });

  it('formatDuration formats ms into human-readable strings', () => {
    const { session } = mountSession();
    expect(session.formatDuration(0)).toBe('just now');
    expect(session.formatDuration(30_000)).toBe('just now'); // < 1 min
    expect(session.formatDuration(60_000)).toMatch(/minute/);
    expect(session.formatDuration(60 * 60_000)).toMatch(/hour/);
    expect(session.formatDuration(25 * 60 * 60_000)).toMatch(/day/);
  });

  it('isFromCurrentDay returns true for today and false otherwise', () => {
    const { session } = mountSession();
    expect(session.isFromCurrentDay(new Date())).toBe(true);
    expect(session.isFromCurrentDay(new Date(Date.now() - 86_400_000))).toBe(false);
  });

  it('clearStorage removes the stored session and resets error', () => {
    const { session } = mountSession();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: 1 }));
    session.clearStorage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
