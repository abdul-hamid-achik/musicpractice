/**
 * Shared Vitest setup — runs before every test file.
 *
 * Stubs the global symbols the app assumes exist (Nuxt auto-imports,
 * h3 server helpers, localStorage, env vars, etc.) so individual tests
 * can rely on a sane baseline and only override what they actually
 * exercise.
 */
import { vi } from 'vitest';

/* -------------------------------------------------------------------------- */
/* localStorage — Map-backed implementation matching the WebStorage API.     */
/* happy-dom does not always expose `localStorage` as a top-level global in   */
/* Vitest 3, so we ship a deterministic, fully synchronous implementation.    */
/* -------------------------------------------------------------------------- */
class MapStorage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    if (index < 0 || index >= this.store.size) return null;
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

vi.stubGlobal('localStorage', new MapStorage());

/* -------------------------------------------------------------------------- */
/* Environment variables — used by server/utils/auth.ts and other modules.   */
/* -------------------------------------------------------------------------- */
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long-for-tests';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

/* -------------------------------------------------------------------------- */
/* Nuxt auto-imported composables / utilities (no-op defaults).              */
/* Individual tests can override any of these with `vi.stubGlobal(...)` or   */
/* by reassigning the global before importing the SUT.                       */
/* -------------------------------------------------------------------------- */
vi.stubGlobal('$fetch', vi.fn());
vi.stubGlobal('useCookie', vi.fn());
vi.stubGlobal(
  'useRoute',
  vi.fn(() => ({ params: {}, query: {}, path: '/' })),
);
vi.stubGlobal(
  'useRouter',
  vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() })),
);
vi.stubGlobal('navigateTo', vi.fn());
vi.stubGlobal(
  'useState',
  vi.fn((_key?: string, init?: () => unknown) => ({
    value: init ? init() : undefined,
  })),
);
/* `useRequestFetch` is a thin wrapper around `$fetch` on the client and a
 * cookie-forwarding fetch on the server. In tests we collapse it to
 * whatever `$fetch` is right now, reading the global at call time so tests
 * that swap in their own `$fetch` mock don't have to stub `useRequestFetch`
 * separately. */
vi.stubGlobal(
  'useRequestFetch',
  vi.fn(() => (globalThis as { $fetch?: unknown }).$fetch),
);

/* useNuxtApp — minimal surface that the app actually uses. */
vi.stubGlobal('useNuxtApp', () => ({
  $fetch: vi.fn(),
  // `runWithContext` simply invokes the callback synchronously. The
  // production implementation establishes a Nuxt context, but tests
  // don't need that wiring.
  runWithContext: <T>(fn: () => T): T => fn(),
}));

/* -------------------------------------------------------------------------- */
/* `import.meta.client` — force the client branch in stores/utilities that   */
/* gate browser-only behavior (e.g. settings store persistence).             */
/* -------------------------------------------------------------------------- */
vi.stubGlobal('import', { meta: { client: true } });

/* -------------------------------------------------------------------------- */
/* Nuxt / h3 server-side helpers (used by server/api/** and server/utils/**).*/
/* These are minimal stubs; tests that exercise a specific handler should    */
/* override the relevant global with a richer mock.                          */
/* -------------------------------------------------------------------------- */
vi.stubGlobal('defineNuxtRouteMiddleware', (fn: unknown) => fn);
vi.stubGlobal('defineEventHandler', (fn: unknown) => fn);

vi.stubGlobal(
  'createError',
  (input: string | { statusCode?: number; message?: string; data?: unknown } = {}) => {
    if (typeof input === 'string') return new Error(input);
    const err = new Error(input.message || 'Nuxt error');
    (err as Error & { statusCode?: number; data?: unknown }).statusCode = input.statusCode;
    (err as Error & { statusCode?: number; data?: unknown }).data = input.data;
    return err;
  },
);

vi.stubGlobal(
  'getRouterParam',
  (event: { context?: { params?: Record<string, string> } } | undefined, key: string) =>
    event?.context?.params?.[key],
);

vi.stubGlobal(
  'getCookie',
  vi.fn(() => undefined),
);
vi.stubGlobal('setCookie', vi.fn());
vi.stubGlobal('deleteCookie', vi.fn());
vi.stubGlobal(
  'getRequestIP',
  vi.fn(() => '127.0.0.1'),
);
vi.stubGlobal(
  'getQuery',
  vi.fn(() => ({})),
);
vi.stubGlobal(
  'readBody',
  vi.fn(async () => ({})),
);

/* useDb — the server's DB accessor. We stub it to a vi.fn so server tests
 * can `.mockReturnValue(...)` a fake Drizzle instance per test. */
vi.stubGlobal('useDb', vi.fn());
