import {
  DIST_BUCKETS, FAILED_BUCKET, LOCKS, dayFromKey,
  type DayKey, type DayStatsDto, type PlayerStatsDto,
} from '@pattern-lock/shared';
import type { DayResultRepository } from '../persistence/DayResultRepository.js';
import type { LockResult } from './DayResult.js';

const bucket = (l: LockResult) => (l.status === 'won' ? l.attempts - 1 : FAILED_BUCKET);
const emptyDist = () => new Array<number>(DIST_BUCKETS).fill(0);

/** Stats derived from stored results: per game day across players, and per player across days. */
export class StatsService {
  constructor(private readonly repository: DayResultRepository) {}

  async dayStats(date: DayKey): Promise<DayStatsDto> {
    const results = await this.repository.listByDate(date);
    const locks = LOCKS.map(() => ({ opened: 0, distribution: emptyDist() }));
    for (const r of results) {
      r.locks.forEach((l, i) => {
        const lock = locks[i]!;
        if (l.status === 'won') lock.opened++;
        lock.distribution[bucket(l)]!++;
      });
    }
    return {
      date,
      players: results.length,
      allOpened: results.filter((r) => r.allOpened).length,
      locks,
    };
  }

  /**
   * `today` is the player's local date. The streak counts consecutive days with all three
   * locks opened, ending today or yesterday; a missed day or a failed lock ends it.
   */
  async playerStats(playerId: string, today: DayKey): Promise<PlayerStatsDto> {
    const results = await this.repository.listByPlayer(playerId);
    const distribution = emptyDist();
    const openedDays = new Set<number>();
    for (const r of results) {
      for (const l of r.locks) distribution[bucket(l)]!++;
      const day = dayFromKey(r.date);
      if (r.allOpened && day !== null) openedDays.add(day);
    }

    const todayNum = dayFromKey(today) ?? 0;
    const playedToday = results.some((r) => r.date === today);
    let currentStreak = 0;
    for (let d = playedToday ? todayNum : todayNum - 1; openedDays.has(d); d--) currentStreak++;

    let bestStreak = 0;
    for (const d of openedDays) {
      if (openedDays.has(d - 1)) continue; // only count from the first day of each run
      let run = 0;
      while (openedDays.has(d + run)) run++;
      bestStreak = Math.max(bestStreak, run);
    }

    const last = results[results.length - 1];
    return {
      played: results.length,
      won: openedDays.size,
      currentStreak,
      bestStreak,
      distribution,
      lastPlayed: last?.date ?? null,
    };
  }
}
