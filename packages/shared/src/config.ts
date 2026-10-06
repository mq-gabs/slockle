import type { LockConfig } from './types.js';

// The seeds still carry the game's original name on purpose: changing them changes every daily answer.
// The 5- and 7-dot locks keep their old seeds so their answers didn't change when locks were added.
export const LOCKS: readonly LockConfig[] = [
  { n: 3, len: 3, attempts: 6, startHints: 1, seed: 'pattern-lock-0' },
  { n: 3, len: 5, attempts: 6, startHints: 1, seed: 'pattern-lock-1' },
  { n: 3, len: 7, attempts: 6, startHints: 1, seed: 'pattern-lock-2' },
  { n: 3, len: 9, attempts: 8, startHints: 3, seed: 'pattern-lock-4' },
];

/** Most attempts any lock allows. */
export const MAX_ATTEMPTS = Math.max(...LOCKS.map((l) => l.attempts));

/** Day 0, puzzle #1. */
export const EPOCH_KEY = '2026-10-05';
export const EPOCH = Date.UTC(2026, 9, 5);

export const DAY_MS = 86_400_000;
