import type { DayKey } from '@pattern-lock/shared';
import type { DayResult } from '../domain/DayResult.js';

/**
 * Storage for daily results, keyed by (date, playerId). Stats are derived from these records,
 * so this is the only thing that needs to be persisted.
 *
 * Implementations must make `add` atomic per (date, playerId): a database version would back it
 * with a unique constraint on the pair.
 */
export interface DayResultRepository {
  /** Stores the result unless one already exists for that date and player. Returns whether it was stored. */
  add(result: DayResult): Promise<boolean>;
  find(date: DayKey, playerId: string): Promise<DayResult | null>;
  listByDate(date: DayKey): Promise<DayResult[]>;
  /** All of a player's results, oldest date first. */
  listByPlayer(playerId: string): Promise<DayResult[]>;
}
