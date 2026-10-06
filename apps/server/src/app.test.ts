import { LOCKS, dailyAnswer, dateKey, lockSet, patternAt, type Pattern } from '@slockle/shared';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { InMemoryDayResultRepository } from './persistence/InMemoryDayResultRepository.js';

// Day 0 is 2026-10-05; the clock sits at noon UTC on `today`.
let today = 0;
const now = () => new Date(Date.UTC(2026, 9, 5 + today, 12));
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  today = 0;
  app = createApp({ repository: new InMemoryDayResultRepository(), now });
});

/** Valid wrong guesses for a lock on a day. */
function misses(lock: number, day: number, count: number): Pattern[] {
  const { all } = lockSet(lock);
  const answer = dailyAnswer(lock, day).join();
  const out: Pattern[] = [];
  for (let i = 0; out.length < count; i += 997) {
    const p = patternAt(all, i % all.count);
    if (p.join() !== answer) out.push(p);
  }
  return out;
}

/** attempts: 1–6 to solve on that guess, or 'X' to fail. */
function lock(i: number, day: number, attempts: number | 'X') {
  if (attempts === 'X') return { guesses: misses(i, day, 6) };
  return { guesses: [...misses(i, day, attempts - 1), dailyAnswer(i, day)] };
}

const submit = (day: number, playerId: string, scores: (number | 'X')[]) =>
  request(app)
    .post(`/api/days/${dateKey(day)}/results`)
    .send({ playerId, locks: scores.map((s, i) => lock(i, day, s)) });

describe('POST /api/days/:date/results', () => {
  it('scores the guesses and stores the result once', async () => {
    const first = await submit(0, 'player-aaaa', [2, 1, 'X']);
    expect(first.status).toBe(201);
    expect(first.body.result).toMatchObject({
      date: '2026-10-05',
      locks: [{ status: 'won', attempts: 2 }, { status: 'won', attempts: 1 }, { status: 'lost', attempts: 6 }],
      allOpened: false,
    });

    const again = await submit(0, 'player-aaaa', [1, 1, 1]);
    expect(again.status).toBe(409);
    expect(again.body.result.locks[2].status).toBe('lost'); // the first submission stands
  });

  it('accepts the neighbouring UTC days, for other time zones, but not older puzzles', async () => {
    expect((await submit(1, 'player-aaaa', [1, 1, 1])).status).toBe(201);
    expect((await submit(-1, 'player-aaaa', [1, 1, 1])).status).toBe(201);
    const old = await submit(-2, 'player-aaaa', [1, 1, 1]);
    expect(old.status).toBe(422);
    expect(old.body.error).toBe('date-not-current');
  });

  it('rejects unfinished locks and guesses the game would not accept', async () => {
    const unfinished = await request(app).post('/api/days/2026-10-05/results')
      .send({ playerId: 'player-aaaa', locks: [lock(0, 0, 1), lock(1, 0, 1), { guesses: misses(2, 0, 2) }] });
    expect(unfinished.status).toBe(422);
    expect(unfinished.body).toEqual({ error: 'lock-unfinished', details: { lock: 2 } });

    const jump = await request(app).post('/api/days/2026-10-05/results')
      .send({ playerId: 'player-aaaa', locks: [{ guesses: [[0, 2, 1, 4, 5]] }, lock(1, 0, 1), lock(2, 0, 1)] });
    expect(jump.status).toBe(422);
    expect(jump.body.error).toBe('invalid-pattern');
  });

  it('rejects malformed requests', async () => {
    expect((await request(app).post('/api/days/2026-02-31/results').send({})).status).toBe(400);
    const bad = await request(app).post('/api/days/2026-10-05/results').send({ playerId: 'x', locks: [] });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('invalid-request');
    const json = await request(app).post('/api/days/2026-10-05/results')
      .set('content-type', 'application/json').send('{nope');
    expect(json.body.error).toBe('invalid-json');
  });
});

describe('GET /api/days/:date/stats', () => {
  it('aggregates every player for the day', async () => {
    await submit(0, 'player-aaaa', [2, 1, 3]);
    await submit(0, 'player-bbbb', [2, 'X', 6]);
    const res = await request(app).get('/api/days/2026-10-05/stats');
    expect(res.status).toBe(200);
    expect(res.body.players).toBe(2);
    expect(res.body.allOpened).toBe(1);
    expect(res.body.locks[0]).toEqual({ opened: 2, distribution: [0, 2, 0, 0, 0, 0, 0] });
    expect(res.body.locks[1]).toEqual({ opened: 1, distribution: [1, 0, 0, 0, 0, 0, 1] });
    expect(res.body.locks).toHaveLength(LOCKS.length);
  });

  it('returns zeros for a day nobody played', async () => {
    const res = await request(app).get('/api/days/2026-09-01/stats');
    expect(res.body).toMatchObject({ players: 0, allOpened: 0 });
  });
});

describe('GET /api/players/:playerId/stats', () => {
  it('tracks played, wins, streaks and the per-lock distribution', async () => {
    for (const [day, scores] of [[0, [1, 2, 3]], [1, [1, 1, 'X']], [2, [2, 2, 2]], [3, [3, 3, 3]]] as const) {
      today = day;
      expect((await submit(day, 'player-aaaa', [...scores])).status).toBe(201);
    }
    const res = await request(app).get('/api/players/player-aaaa/stats?today=2026-10-08');
    expect(res.body).toEqual({
      played: 4,
      won: 3,
      currentStreak: 2, // days 2 and 3; the failed lock on day 1 broke the first run
      bestStreak: 2,
      distribution: [3, 4, 4, 0, 0, 0, 1],
      lastPlayed: '2026-10-08',
    });

    // Not played yet today: yesterday's streak still counts. Two days later it's gone.
    const tomorrow = await request(app).get('/api/players/player-aaaa/stats?today=2026-10-09');
    expect(tomorrow.body.currentStreak).toBe(2);
    const later = await request(app).get('/api/players/player-aaaa/stats?today=2026-10-10');
    expect(later.body.currentStreak).toBe(0);
  });

  it('returns empty stats for a new player and validates the id', async () => {
    const res = await request(app).get('/api/players/player-new1/stats');
    expect(res.body).toMatchObject({ played: 0, currentStreak: 0, lastPlayed: null });
    expect((await request(app).get('/api/players/no/stats')).status).toBe(400);
  });
});

describe('InMemoryDayResultRepository', () => {
  it('keeps one result per player and day, and hands out copies', async () => {
    const repo = new InMemoryDayResultRepository();
    const result = {
      date: '2026-10-05', playerId: 'p1', allOpened: true, submittedAt: new Date(),
      locks: [{ status: 'won' as const, attempts: 1 }],
    };
    expect(await repo.add(result)).toBe(true);
    expect(await repo.add({ ...result, allOpened: false })).toBe(false);
    const found = await repo.find('2026-10-05', 'p1');
    found!.locks[0]!.attempts = 6;
    expect((await repo.find('2026-10-05', 'p1'))!.locks[0]!.attempts).toBe(1);
    expect(await repo.listByPlayer('p1')).toHaveLength(1);
  });
});
