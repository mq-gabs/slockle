import type { LockConfig } from './types.js';

// The seeds still carry the game's original name on purpose: changing them changes every daily answer.
export const LOCKS: readonly LockConfig[] = [
  { n: 3, len: 5, startHints: 1, seed: 'pattern-lock-1' },
  { n: 3, len: 7, startHints: 1, seed: 'pattern-lock-2' },
  { n: 4, len: 6, startHints: 2, seed: 'pattern-lock-3' },
];

export const MAX_ATTEMPTS = 6;

/** Day 0, puzzle #1. */
export const EPOCH_KEY = '2026-10-05';
export const EPOCH = Date.UTC(2026, 9, 5);

export const DAY_MS = 86_400_000;
