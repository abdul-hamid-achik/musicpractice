# Tests

This directory holds the Vitest suite for MusicPractice. The suite covers
client-side code (Vue components, composables, Pinia stores) and
server-side code (Nitro route handlers, server utilities, env
validation). All tests run in the same `vitest` process under
`happy-dom`, with shared globals stubbed in `tests/setup.ts` so each
file only has to set up the state it actually exercises.

## Running the suite

The relevant scripts are defined in `package.json`:

| Command                      | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `bun run test:unit`          | Run the suite once and exit. Use this in CI.          |
| `bun run test`               | Run the suite in watch mode (re-runs on file change). |
| `bun run test:watch`         | Alias of `bun run test`.                              |
| `bun run test -- --coverage` | Generate a coverage report (HTML + text).             |

Coverage includes the high-traffic domains: `app/composables/**`,
`app/stores/**`, `app/components/**`, `app/pages/**`, `server/api/**`,
`server/utils/**`, and `shared/**`. Open `coverage/index.html` after
running with coverage to browse per-file line/branch breakdowns.

The Node environment is configured by `vitest.config.ts`:

- `import.meta.client` is forced to `true` so client-gated branches
  (e.g. settings-store persistence) execute in tests.
- `vue` and the contents of `app/composables/` are auto-imported.
- `~` and `#shared` aliases point at `app/` and `shared/` respectively.

## Layout

```
tests/
├── setup.ts                       # Shared Vitest setup (see below)
├── components/                    # Vue component tests
│   ├── Metronome.test.ts
│   ├── PianoKeyboard.test.ts
│   ├── ChordLibrary.test.ts
│   ├── CircleOfFifths.test.ts
│   ├── IntervalTrainer.test.ts
│   ├── NoteIdentifier.test.ts
│   └── ScaleExplorer.test.ts
├── unit/
│   ├── composables/               # Composable tests
│   │   ├── useDebounce.test.ts
│   │   ├── useInstrumentSound.test.ts
│   │   ├── useMetronome.test.ts
│   │   ├── useMusicTheory.test.ts
│   │   └── useToast.test.ts
│   └── stores/                    # Pinia store tests
│       ├── auth.test.ts
│       ├── instrument.test.ts
│       ├── practice.test.ts
│       ├── settings.test.ts
│       ├── theory.test.ts
│       └── toast.test.ts
└── ../server/                     # Server tests live next to the code
    ├── api/
    │   └── auth/register.post.test.ts
    └── utils/
        ├── auth.test.ts
        ├── errors.test.ts
        ├── rate-limit.test.ts
        └── streaks.test.ts
```

`vitest.config.ts` globs `tests/**/*.test.ts` and `server/**/*.test.ts`,
so the test runner picks up both trees automatically. Server tests live
next to the code they exercise (rather than in a parallel tree) so they
can import the handler directly without an `~` alias dance.

### `tests/setup.ts`

Runs before every test file. It:

- Stubs `localStorage` with a Map-backed implementation (Vitest 3's
  `happy-dom` does not always expose it as a top-level global).
- Seeds `JWT_SECRET`, `DATABASE_URL`, and `NODE_ENV=test` so server
  modules that read `process.env` at import time don't throw.
- Stubs the Nuxt auto-imports the app actually uses (`$fetch`,
  `useState`, `useRoute`, `useRouter`, `navigateTo`, `useCookie`,
  `useRequestFetch`, `useNuxtApp`).
- Stubs h3 server helpers (`defineEventHandler`, `createError`,
  `getCookie`, `setCookie`, `deleteCookie`, `getQuery`, `readBody`,
  `getRequestIP`, `getRouterParam`) and the `useDb()` Nitro helper.
- Forces `import.meta.client` to `true`.

Individual tests can override any stub via `vi.stubGlobal(...)` or
`vi.mock(...)` without touching this file.

## What's covered

| Domain           | Coverage                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Server utilities | `auth`, `errors`, `rate-limit`, `streaks`                                                                            |
| Server API       | `auth/register` (and growing per route)                                                                              |
| Composables      | `useDebounce`, `useInstrumentSound`, `useMetronome`, `useMusicTheory`, `useToast`                                    |
| Pinia stores     | `auth`, `instrument`, `practice`, `settings`, `theory`, `toast`                                                      |
| Components       | `Metronome`, `PianoKeyboard`, `ChordLibrary`, `CircleOfFifths`, `IntervalTrainer`, `NoteIdentifier`, `ScaleExplorer` |

The full server API matrix (one test file per route, exercising 400/401/
403/404/409/200 paths) is the long-running goal — the suite is
incremental; new files land as their handlers stabilize.

## Patterns

### Server handler tests

Mock the database module so handlers can be invoked with a synthetic
`H3Event` and the `tests/setup.ts` stubs cover the rest:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../db', () => ({ db: { select: vi.fn() } }));
vi.mock('../../utils/auth', () => ({ requireAuth: vi.fn() }));

import handler from '../../api/foo.get';
import { db } from '../../db';
import { requireAuth } from '../../utils/auth';

describe('GET /api/foo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with rows', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 'u1' } as any);
    vi.mocked(db.select).mockReturnValue({
      from: () => ({ where: () => ({ limit: async () => [{ id: '1' }] }) }),
    } as any);

    const event = { context: {}, node: { req: {}, res: {} } } as any;
    const result = await handler(event);
    expect(result).toEqual({ id: '1' });
  });
});
```

### Composable tests

Use `mount` from `@vue/test-utils` only when the composable depends on
the component lifecycle. For pure logic composables, call the
returned function directly inside `vi.fn()`-driven timers.

```ts
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '../../app/composables/useDebounce';

describe('useDebounce', () => {
  it('collapses rapid changes into one update', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = useDebounce(fn, 100);

    debounced('a');
    debounced('b');
    debounced('c');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });
});
```

### Component tests

Mount with `mount(...)`, stub the heavy native modules (`tone`,
`@coderline/alphatab`, `vexflow`) and the auto-imported composables
the component pulls in. Assert on rendered text, key DOM structure,
aria attributes, and emitted event payloads — not on audio output or
pixel-perfect SVG.

```ts
vi.mock('tone', () => ({ Synth: vi.fn(), start: vi.fn() }));
```

## Adding a new test

1. Pick the directory that matches what you're testing:
   - Component → `tests/components/<Name>.test.ts`
   - Composable → `tests/unit/composables/<name>.test.ts`
   - Store → `tests/unit/stores/<name>.test.ts`
   - Server route → `server/api/<route>.test.ts`
   - Server util → `server/utils/<util>.test.ts`
2. Use the patterns above. Mock the database for server tests; mock
   `tone`/`@coderline/alphatab`/`vexflow` for components that import
   them.
3. Run `bun run test:unit` to confirm the new test passes alongside
   the rest of the suite.
4. If you add a new global (a Nuxt composable, h3 helper, etc.) that
   the production code assumes, add a `vi.stubGlobal(...)` in
   `tests/setup.ts` so other test files benefit too.
5. Do not commit a test that `skip()`s or `todo()`s out an assertion
   — the verifier will flag it.

## Troubleshooting

- **`useDb is not a function`** — the suite's `useDb` stub from
  `tests/setup.ts` is `vi.fn()`. If your test needs a richer return,
  override it locally with `vi.stubGlobal('useDb', () => fakeDb)`.
- **`Cannot read properties of undefined (reading 'then')`** — usually
  a mocked `db.select().from().where().limit()` chain is missing a
  method. Cast the chain to `as any` and return what the handler asks
  for.
- **`localStorage` is undefined** in CI — `tests/setup.ts` installs a
  Map-backed shim; if you see this error, the setup file was not
  loaded. Check `vitest.config.ts` `setupFiles`.
- **Vue warnings about unresolved components** — components like
  `NordButton` are auto-registered globally via the
  `components: [{ path: '~/components', pathPrefix: false }]` option in
  `nuxt.config.ts`. In tests, import them directly from
  `app/components/ui/NordButton.vue` or stub them with
  `global.stubs`.
