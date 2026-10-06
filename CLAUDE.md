# Daily Pattern Lock

A once-a-day browser puzzle: crack three hidden phone-style unlock patterns (3×3, 3×3, 4×4) with six attempts each, using colour feedback and hints. TypeScript monorepo: React front end, Express API, shared game logic.

## Commands

Run from the repo root.

| Command | What it does |
| --- | --- |
| `npm install` | Installs all workspaces |
| `npm run dev` | API on :3001 (tsx watch) and Vite on :5173; Vite proxies `/api` to the API |
| `npm test` | Vitest for every workspace (shared logic + API) |
| `npm run typecheck` | `tsc --noEmit` in each workspace |
| `npm run build` | Builds shared → server → web, in that order (each depends on the previous) |
| `npm start` | Runs the built server, which also serves `apps/web/dist` at `/` |

Run one test file: `npx vitest run apps/server/src/app.test.ts`.

## Layout

```
packages/shared/   @pattern-lock/shared: game rules used by both sides
  src/grid.ts        geometry: dots between two dots, valid patterns, line kinds, turns, regions
  src/patterns.ts    enumerate every valid pattern; lockSet() caches each lock's list + answer pool
  src/daily.ts       day numbers ↔ YYYY-MM-DD keys, seeded daily answer
  src/feedback.ts    green/yellow/gray marks
  src/hints.ts       hint specs, tiers, nextHint() selection rules
  src/outcome.ts     lock outcome from guesses, checkGuesses() (server-side validation), emoji rows
  src/share.ts       share text
  src/api.ts         HTTP request/response types (the contract between web and server)
apps/server/       @pattern-lock/server: Express 5
  src/app.ts         createApp({ repository, now, webDist }); used by index.ts and tests
  src/domain/        DayResult entity, ResultService (score + store), StatsService (derive stats)
  src/persistence/   DayResultRepository interface + InMemoryDayResultRepository
  src/http/          zod schemas, routes, error handler
apps/web/          @pattern-lock/web: Vite + React 19
  src/App.tsx        picks the day from ?d=, wires dialogs, submits today's finished game
  src/game/          localStorage, per-day state, useDayGame hook (guess flow, hints, lazy answers)
  src/components/    PatternGrid (SVG), DrawingBoard (pointer input), screens and dialogs
  src/i18n/          strings (en, pt-BR), hint wording per language, I18nProvider/useI18n
  src/api/client.ts  fetch wrappers for the API
```

## How it fits together

- **Everything about the rules lives in `shared`.** The web app uses it to play; the server uses it to re-score submissions. Don't duplicate rule logic in either app.
- **The client sends guesses, not scores.** `POST /api/days/:date/results` carries each lock's guesses; `ResultService` replays them against `dailyAnswer()` with `checkGuesses()`/`lockOutcome()` and stores the derived result. Unfinished locks, invalid patterns, repeats and guesses after a solve are rejected (422).
- **Only today's puzzle counts.** The server accepts a date only within ±1 day of its UTC date (players change day at their own local midnight). Past puzzles from the archive are played locally and never submitted.
- **One result per player per day.** A second submit returns 409 with the stored result; the client treats 201 and 409 both as "saved".
- **Players are anonymous.** The browser makes a UUID once (`pattern-lock-player` in localStorage) and sends it with submissions and stats requests.
- **Progress stays in the browser.** Each day's state is saved under `pattern-lock-day-YYYY-MM-DD`; the server only sees finished days. `DayState.submitted` records that today's result reached the server; failed sends retry on the next visit.

### API

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Liveness |
| `POST /api/days/:date/results` | Submit a finished day: `{ playerId, locks: [{ guesses }] }` → 201 / 409 `{ result }` |
| `GET /api/days/:date/stats` | Per-day aggregate across players: players, all-three-opened count, per-lock distribution |
| `GET /api/players/:playerId/stats?today=YYYY-MM-DD` | Played, days won, current/best streak, per-lock distribution |

Errors are `{ error: code, details? }`. Types for all of these are in `packages/shared/src/api.ts`; change them there and both sides follow.

Distributions are arrays of 7: index 0–5 = solved in 1–6 attempts, index 6 = failed (`FAILED_BUCKET`).

### Persistence

`DayResultRepository` (`apps/server/src/persistence/DayResultRepository.ts`) is the only storage abstraction. Results are the source of truth; day stats and player stats are computed from them in `StatsService`.

To add a real store (SQL, Redis, …): implement the interface in `apps/server/src/persistence/`, keep `add()` atomic per (date, playerId) (a unique constraint), keep `listByPlayer()` sorted by date, then construct it in `apps/server/src/index.ts`. The in-memory repo loses everything on restart and is meant for development and tests.

## Conventions and gotchas

- **Dots are 0-based internally** (index 0 is the dot shown as "1"), left to right, top to bottom. Only UI text adds 1.
- **Day numbers vs keys.** Day 0 is `2026-10-05` (puzzle #1). Use `dateKey()`/`dayFromKey()`; `dayNumber()` is the player's local day, `utcDayNumber()` is for the server. Puzzles before the epoch have no number; the share text uses the date instead.
- **Daily answers are seeded from lock seed + date**, so any date regenerates independently. Patterns can repeat across days. Changing a lock's `seed`, `len` or the quality filter in `lockSet()` changes every past and future answer and invalidates saved progress.
- **Lock 3's list has 1,331,944 patterns** and takes ~250 ms to build. The server builds all lists at startup; the web app builds lazily behind a "Preparing…" message (`useDayGame`). Avoid calling `lockSet(2)`/`dailyAnswer(2, …)` during render.
- **Hints are data (`HintSpec`).** `nextHint()` picks them; the web app words them per language in `apps/web/src/i18n/hints.ts`. A new hint kind needs: the spec type in `shared/types.ts`, `hintTest()` and a tier in `shared/hints.ts`, and wording in every language.
- **Translations:** `strings.ts` types `pt` (and any new language) as `Record<StringKey, …>`, so a missing key fails the typecheck. Add a language by adding its strings, its hint writer and an entry in `LANGS`. Portuguese uses "Padrão" for a lock and "ordem" for a step.
- **Drawing:** the pointer reach is 0.25 dot spacings on purpose; larger values make some valid 4×4 moves impossible to draw straight. A line over an unused dot adds that dot (`skippedDots`), like a phone lock.
- **Thumbnails** draw direction arrows (`PatternGrid` `arrows`), placed in gaps between dots and moved apart where moves cross or retrace.
- **Module resolution:** `@pattern-lock/shared` exports a `development` condition pointing at `src/index.ts`. Vite, tsx (`--conditions=development`), Vitest and the typechecks use it, so development never needs a build. Production builds resolve `dist/`, which is why `npm run build` builds shared first.
- **TypeScript is 7.x** (the native compiler). Server and shared use `NodeNext` with `.js` extensions in relative imports; the web app uses `Bundler` resolution without extensions.
- **Accepted trade-off:** answers are computed in the browser, so a determined player can read them. The server only guarantees that stored results are consistent with real guesses.

## Testing

- `packages/shared/src/shared.test.ts`: pattern counts from the spec (7,152 / 72,912 / 1,331,944), feedback, dates, validation, hints, share text.
- `apps/server/src/app.test.ts`: the HTTP API through supertest with an injected clock (`now`) and a fresh in-memory repository per test; also the repository contract.
- The web app has no automated tests yet. Check UI changes in a browser at phone width (360–390 px) in both languages and both colour schemes.
