<p align="center"><img src="apps/web/public/logo.svg" alt="Slockle logo" width="96"></p>

# Slockle

A once-a-day browser puzzle: crack four hidden phone-style unlock patterns on a 3×3 grid, using colour feedback and hints.

Everyone gets the same four locks each day, and a new puzzle arrives at local midnight. Missed days can be played from the archive.

## How to play

| Lock | Dots | Attempts | Starting hints |
| --- | --- | --- | --- |
| 1 | 3 | 6 | 1 |
| 2 | 5 | 6 | 1 |
| 3 | 7 | 6 | 1 |
| 4 | 9 | 8 | 3 |

- Drag across the dots to draw a pattern. Each dot is used once, and a line over an unused dot picks it up, like a real phone lock.
- Order matters: 1→2→5 and 5→2→1 are different patterns.
- You know the length. A guess of the wrong length doesn't cost an attempt.
- After each guess, every dot gets a mark:
  - 🟩 **green**: the right dot at this step
  - 🟨 **yellow**: in the pattern, at another step
  - ⬜ **gray**: not in the pattern
- Each miss unlocks a new hint (where the pattern starts or ends, how many lines of each direction it has, a dot it avoids, a dot at a given step…). Hints get more specific as you go.

When you finish, you can share an emoji summary of your day. Stats track your streaks and how many attempts each lock took.

The game is available in English and Brazilian Portuguese.

## Getting started

You need Node.js 22.12 or later (24 recommended).

```sh
npm install
npm run dev
```

Open <http://localhost:5173>. The API runs on port 3001, and Vite forwards `/api` to it.

To try it on a phone on the same network, run `npm run dev:lan` and open the Network URL it prints.

## Scripts

Run from the repo root.

| Command | What it does |
| --- | --- |
| `npm run dev` | API (port 3001) and web app (port 5173) with live reload |
| `npm run dev:lan` | Same, with the web app reachable from other devices |
| `npm test` | Runs all tests (Vitest) |
| `npm run typecheck` | Type-checks every workspace |
| `npm run build` | Builds shared, then server, then web |
| `npm start` | Runs the built server, which also serves the web app |

## Production

```sh
npm run build
npm start
```

The server serves the API and the built web app from one port.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port the server listens on |
| `WEB_DIST` | `apps/web/dist` | Folder of the built web app |

Results are kept in memory for now, so they are lost when the server restarts. See [Storage](#storage) for adding a real database.

## Project layout

A TypeScript monorepo with npm workspaces:

```
packages/shared/   game rules: grid geometry, patterns, daily answers, feedback, hints, scoring, API types
apps/server/       Express 5 API that re-scores and stores results and computes stats
apps/web/          Vite + React 19 front end
```

All game rules live in `packages/shared`, and both apps use them. The browser plays the game; the server replays the submitted guesses to check them.

### How a day works

1. Each day's answers are generated from a fixed seed per lock plus the date, so every date always gets the same patterns.
2. Progress is saved in the browser's localStorage. Players are anonymous: the browser creates a random ID once.
3. When today's puzzle is finished, the browser sends the guesses (not a score) to the server. The server checks them against the real answers and stores the result. Each player gets one result per day.
4. Only today's puzzle is submitted. Archive games stay local.

### API

| Route | Purpose |
| --- | --- |
| `GET /api/health` | Health check |
| `POST /api/days/:date/results` | Submit a finished day: `{ playerId, locks: [{ guesses }] }` |
| `GET /api/days/:date/stats` | Stats for one day across all players |
| `GET /api/players/:playerId/stats?today=YYYY-MM-DD` | A player's games, wins, streaks and attempt distribution |

Request and response types are in [packages/shared/src/api.ts](packages/shared/src/api.ts).

### Storage

The server stores results through one interface, [DayResultRepository](apps/server/src/persistence/DayResultRepository.ts). To use a real database, implement it in `apps/server/src/persistence/` (keeping one result per date and player) and plug it in at [apps/server/src/index.ts](apps/server/src/index.ts).

## Configuration

The locks are defined in [packages/shared/src/config.ts](packages/shared/src/config.ts): grid size, pattern length, attempts, starting hints and seed.

Changing a lock's seed or length changes every past and future answer and invalidates players' saved progress. The seeds still use the game's old name (`pattern-lock-…`) for this reason.

## Contributing

- Run `npm test` and `npm run typecheck` before committing.
- The web app has no automated tests yet. Check UI changes in a browser at phone width (360–390 px), in both languages and both light and dark mode.
- New text needs a translation in every language in [apps/web/src/i18n/strings.ts](apps/web/src/i18n/strings.ts); a missing one fails the type check.

More detail on conventions and internals is in [CLAUDE.md](CLAUDE.md).
