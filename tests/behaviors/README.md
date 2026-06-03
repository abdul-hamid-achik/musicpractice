# MusicPractice Behavioral Automations

Cairntrace specs that drive the **real** MusicPractice app through a real
browser and assert its behaviors end to end. Lives inside the project
(at `tests/behaviors/`) so the tests travel with the code.

## What's here

```
tests/behaviors/
├── cairntrace.config.yml      # base URL + per-flow vars (song title etc.)
├── Taskfile.yml               # entry point: task test, task run FLOW=…
├── actions/                   # reusable step snippets (login, register)
├── flows/                     # 17 behavioral specs
│   ├── auth_register_login.yml
│   ├── account_change_password.yml
│   ├── home_page_anonymous.yml
│   ├── not_found_page.yml
│   ├── dashboard_loads_with_streak.yml
│   ├── perf_landing_dashboard.yml
│   ├── practice_hub_load.yml
│   ├── practice_session_log_to_history.yml
│   ├── practice_history_load.yml
│   ├── goals_crud.yml
│   ├── songs_crud.yml
│   ├── theory_index_load.yml
│   ├── theory_scales_load.yml
│   ├── theory_chords_load.yml
│   ├── ear_training_load.yml
│   ├── instruments_index_load.yml
│   └── settings_theme_persists.yml
├── runs/                      # cairn artifacts (snapshots, network, console)
└── README.md                  # this file
```

## Prereqs

- `cairn` on PATH (`cairn doctor` should print `OK`)
- `agent-browser` (cairn's default backend; installed via bun or your
  package manager of choice)
- MusicPractice dev server running on `http://localhost:3000`
  (`bun run dev` in another terminal)
- Test-user env vars exported (see `task setup`)

## Quick start

```sh
# 1. Print the env vars you'll need for the register path.
bun run behaviors:setup

# 2. Copy the printed `export MP_E2E_NEW_*` lines into your shell.

# 3. Run all flows sequentially.
bun run behaviors:test

# 4. Or run a single flow.
bun run behaviors:run -- FLOW=flows/dashboard_loads_with_streak.yml

# 5. Run just the performance baseline.
bun run behaviors:perf
```

If you already have a seeded test user, set `MP_E2E_EMAIL` and
`MP_E2E_PASSWORD` instead — and swap `use: register_musicpractice` for
`use: login_musicpractice` in the flow you want to drive (or add a
hybrid `ensure_auth` action — see "Hybrid auth" below).

## Hybrid auth

`actions/register_musicpractice.yml` self-registers a throwaway user per
run (hermetic, no DB setup needed). `actions/login_musicpractice.yml`
logs in as a pre-seeded user (faster, repeatable). Every default flow
uses the register path. To switch a flow to the login path, replace:

```yaml
imports:
  - ../actions/register_musicpractice.yml
```

with:

```yaml
imports:
  - ../actions/login_musicpractice.yml
```

…and replace every `use: register_musicpractice` with
`use: login_musicpractice`. (Yes, this is mildly tedious — a smart
`ensure_auth` snippet that picks based on env presence is the next
improvement; ping if you want it.)

## Adding a regression

Per `~/projects/automations/graphite`'s convention: **add a spec, not a
task.** Drop a new `flows/<name>.yml`, add any reusable step snippet to
`actions/`, add any new vars to `cairntrace.config.yml`'s `vars:` block,
and run it with `bun run behaviors:run -- FLOW=flows/<name>.yml`. Do
**not** add a bespoke `task <thing>` per spec.

## Out of scope (for now)

- Theory sub-tools (IntervalTrainer, ScaleExplorer, ChordLibrary,
  CircleOfFifths, ear-training) — these use Tone.js to synthesise audio
  in the browser, which is fragile to automate. Add when the audio
  pipeline is stable.
- Instrument tools (piano, guitar, bass, violin fretboards) — visual
  canvas + audio. Same caveat.
- Metronome — depends on Tone.js. Same caveat.

## Troubleshooting

- **`cairn doctor` fails** on agent-browser: install with
  `bun add -g agent-browser` (or `npm i -g agent-browser`).
- **Spec hangs on `wait: text: …`** with no match: the page is probably
  showing an error overlay (e.g. JWT_SECRET warning in dev). Check
  `runs/<timestamp>/console` artifacts.
- **"Resource temporarily unavailable"** during `test`: an orphan
  headless Chrome from a previous run is hogging memory. Run
  `bun run behaviors:cleanup`.
- **Outcomes are flaky on perf**: ceilings are deliberately loose.
  Tighten them as you gather baselines; loosen them if the dev machine
  is noisy.

## Relationship to vitest unit tests

The vitest suite at `tests/` covers logic in isolation (composables,
stores, server endpoints, components). The cairn suite here covers
**behaviors in a real browser** — the things the unit suite cannot catch
(middleware redirects, cookie round-trips, network-shape contracts,
actual page rendering, performance budgets). Both are needed; neither
replaces the other.
