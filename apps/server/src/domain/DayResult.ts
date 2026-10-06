import type { DayKey } from '@slockle/shared';

export interface LockResult {
  status: 'won' | 'lost';
  /** Guesses used for a won lock; the lock's attempt limit for a lost one. */
  attempts: number;
}

/** One player's finished game for one day. A player has at most one per day. */
export interface DayResult {
  date: DayKey;
  playerId: string;
  locks: LockResult[];
  allOpened: boolean;
  submittedAt: Date;
}
