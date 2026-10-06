import type { DayKey } from '@pattern-lock/shared';

export interface LockResult {
  status: 'won' | 'lost';
  /** 1–6 for a won lock; 6 for a lost one. */
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
