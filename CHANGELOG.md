# Changelog

All notable changes to MusicPractice are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-06-01

### Bug Fixes

- **`server/api/progress/[songId].put.ts`** now uses `getRouterParam(event,
'songId')` instead of the non-functional `event.context.params?.songId`.
  The previous code silently treated the song ID as `undefined`, causing
  progress upserts to fail in production.
- **`server/api/sessions/index.get.ts`** error log no longer references
  `event.context.params?.id` (always undefined); it now reports the
  authenticated `user.id`.
- **Removed duplicate progress routes** (`POST /api/progress`,
  `GET/PUT/DELETE /api/progress/:id`). The frontend uses the
  `PUT /api/progress/:songId` upsert pattern, so the duplicate
  per-progress-id handlers were dead code that complicated the surface.
- **Auth middleware** (`app/middleware/auth.ts`) now validates the JWT via
  `useRequestFetch('/api/auth/me')` instead of merely checking that the
  cookie exists. Stale or forged cookies are rejected with a redirect to
  `/auth/login`. The Pinia auth store's `fetchUser` action was updated to
  match.
- **Weekly stats naming**: `server/api/stats/weekly.get.ts` (which
  actually returned 14 days) renamed to `server/api/stats/daily.get.ts`
  with an optional `?days=N` query parameter (default 14, min 1, max 90).
  The dashboard `PracticeChart` component was updated to call the new
  endpoint with `days=14`.
- **Tone.js memory leaks** in `IntervalTrainer.vue`, `ScaleExplorer.vue`,
  and `ChordLibrary.vue` fixed: synths are now cached at component scope
  and disposed in `onBeforeUnmount` instead of being created on every
  `play()` call.
- **Hardcoded `chromaticOrder` array** in `ScaleExplorer.vue` replaced
  with `useMusicTheory().getNoteNames()` so theory data has a single
  source of truth.
- **JWT_SECRET validation** tightened: in production the server now
  throws at boot if the secret is missing, shorter than 32 characters,
  or still equal to the development default in `.env.example`.

### Test Coverage

- Vitest infrastructure stabilised: `tests/setup.ts` stubs every Nuxt/h3
  global the app assumes, so server, store, composable, and component
  tests can run in isolation without a live Nuxt context.
- Server utilities (`auth`, `errors`, `rate-limit`, `streaks`,
  `env`) now have direct unit tests.
- New test suites for every composable under `app/composables/`
  (`useDebounce`, `useMetronome`, `useMusicTheory`, `useToast`,
  `useInstrumentSound`, `useAudio`, `useAlphaTab`, `useKeyboardShortcuts`,
  `useAccessibility`, `useSidebar`, `usePracticeSession`).
- Store tests expanded to cover `auth`, `instrument`, `practice`,
  `settings`, `theory`, and `toast` Pinia stores, including persistence
  edge cases.
- Component tests for every `.vue` under `app/components/` (theory,
  instruments, practice, dashboard, ui).
- Tests are run from `bun run test:unit`; coverage from
  `bun run test -- --coverage`. See `tests/README.md` for the full layout
  and how to add new tests.

### Security Hardening

- **New `server/utils/env.ts` central loader and validator.** `DATABASE_URL`
  is required in every environment; `JWT_SECRET` must be set, ≥ 32 chars,
  and not the well-known dev default in production. The module is imported
  by `server/utils/db.ts`, `server/utils/auth.ts`, and `server/db/index.ts`
  so validation runs once at boot, with a single source of truth.
- **Security response headers** now applied to every route via
  `nitro.routeRules` in `nuxt.config.ts` and duplicated in `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: microphone=(), camera=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (production only)
  - `Content-Security-Policy` allowing `'self'`, Google Fonts, `data:` images,
    `blob:` for synthesised audio, and the inline scripts required by Nuxt
    and Tailwind runtime.
- **Rate limiting** (`server/utils/rate-limit.ts`) expanded beyond
  `/api/auth/login` and `/api/auth/register` to cover the rest of the
  sensitive write surface: song CRUD, session CRUD, account
  change-password / delete, ear-training submissions, and goal creation.
  Per-user keys when authenticated, IP keys otherwise.

### Vercel Deploy

- `vercel.json` declares Bun-based install + build commands and the
  `nuxtjs` framework preset.
- Security headers are also emitted at the Vercel edge, so they're
  applied even if a Nitro handler bypasses its own response cycle.
- `JWT_SECRET` and `DATABASE_URL` are documented as required environment
  variables in the Vercel project settings.

### Documentation

- `README.md` API Endpoints Overview table corrected to match the real
  route surface (account sub-routes, song/session/goal `:id` verbs,
  removed `POST /api/streaks/update`, renamed `weekly` → `daily?days=N`,
  `ear-training/submit` → `ear-training`).
- `API.md` rewritten to match the current `server/api/` tree; the four
  removed progress routes are no longer documented.

## [0.1.0] — 2025-04-15

### Added

- Initial release: Nuxt 4 + Vue 3 + Drizzle + PostgreSQL music practice
  tracker.
- Interactive fretboards/keyboards for guitar, bass, piano, violin.
- Practice session logging with auto-updating streaks.
- Song library with AlphaTab notation, search, and difficulty filtering.
- Music theory: scales, chords, circle of fifths, interval trainer.
- Ear training with score history.
- Metronome with saveable presets.
- Goals, progress tracking, daily/weekly statistics, and heatmap.
- JWT cookie-based authentication with bcrypt password hashing.
- Drizzle migrations and seed data.
