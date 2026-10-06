import type { DayKey } from '@slockle/shared';
import type { DayResult } from '../domain/DayResult.js';
import type { DayResultRepository } from './DayResultRepository.js';

/** Keeps results in process memory; everything is lost on restart. For development and tests. */
export class InMemoryDayResultRepository implements DayResultRepository {
  private readonly byDate = new Map<DayKey, Map<string, DayResult>>();
  private readonly byPlayer = new Map<string, Map<DayKey, DayResult>>();

  async add(result: DayResult): Promise<boolean> {
    let day = this.byDate.get(result.date);
    if (!day) this.byDate.set(result.date, (day = new Map()));
    if (day.has(result.playerId)) return false;

    const stored = structuredClone(result);
    day.set(result.playerId, stored);
    let player = this.byPlayer.get(result.playerId);
    if (!player) this.byPlayer.set(result.playerId, (player = new Map()));
    player.set(result.date, stored);
    return true;
  }

  async find(date: DayKey, playerId: string): Promise<DayResult | null> {
    const found = this.byDate.get(date)?.get(playerId);
    return found ? structuredClone(found) : null;
  }

  async listByDate(date: DayKey): Promise<DayResult[]> {
    return [...(this.byDate.get(date)?.values() ?? [])].map((r) => structuredClone(r));
  }

  async listByPlayer(playerId: string): Promise<DayResult[]> {
    return [...(this.byPlayer.get(playerId)?.values() ?? [])]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => structuredClone(r));
  }
}
