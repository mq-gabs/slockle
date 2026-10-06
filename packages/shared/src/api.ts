// HTTP contract between the web app and the server. Both sides import these types.
import { MAX_ATTEMPTS } from './config.js';
import type { DayKey } from './daily.js';
import type { Pattern } from './types.js';

/**
 * Distribution buckets: index 0..MAX_ATTEMPTS-1 = solved in 1..MAX_ATTEMPTS attempts, the last
 * one (FAILED_BUCKET) = failed (X). Locks with fewer attempts leave their extra buckets at 0.
 */
export const DIST_BUCKETS = MAX_ATTEMPTS + 1;
export const FAILED_BUCKET = MAX_ATTEMPTS;

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
  /** Players who opened every lock. */
  allOpened: number;
  locks: { opened: number; distribution: number[] }[];
}

/** GET /api/players/:playerId/stats?today=YYYY-MM-DD */
export interface PlayerStatsDto {
  played: number;
  /** Days with every lock opened. */
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
