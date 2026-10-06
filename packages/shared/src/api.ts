// HTTP contract between the web app and the server. Both sides import these types.
import type { DayKey } from './daily.js';
import type { Pattern } from './types.js';

/** Distribution buckets: index 0..5 = solved in 1..6 attempts, index 6 = failed (X). */
export const DIST_BUCKETS = 7;
export const FAILED_BUCKET = 6;

/** POST /api/days/:date/results */
export interface SubmitResultRequest {
  playerId: string;
  /** One entry per lock, in order. The server replays the guesses to score them. */
  locks: { guesses: Pattern[] }[];
}

export interface LockResultDto {
  status: 'won' | 'lost';
  attempts: number;
}

export interface DayResultDto {
  date: DayKey;
  playerId: string;
  locks: LockResultDto[];
  allOpened: boolean;
  submittedAt: string;
}

/** 201 with the stored result; 409 with the existing one when the player already submitted. */
export interface SubmitResultResponse {
  result: DayResultDto;
}

/** GET /api/days/:date/stats */
export interface DayStatsDto {
  date: DayKey;
  players: number;
  /** Players who opened all three locks. */
  allOpened: number;
  locks: { opened: number; distribution: number[] }[];
}

/** GET /api/players/:playerId/stats?today=YYYY-MM-DD */
export interface PlayerStatsDto {
  played: number;
  /** Days with all three locks opened. */
  won: number;
  currentStreak: number;
  bestStreak: number;
  /** Per lock, across all days; see DIST_BUCKETS. */
  distribution: number[];
  lastPlayed: DayKey | null;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
