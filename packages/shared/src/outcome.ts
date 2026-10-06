import { LOCKS, MAX_ATTEMPTS } from './config.js';
import { feedback } from './feedback.js';
import { isValidPattern } from './grid.js';
import { Mark, type LockStatus, type Pattern } from './types.js';

export interface LockOutcome {
  status: LockStatus;
  /** Guesses used; for a lost lock this is MAX_ATTEMPTS. */
  attempts: number;
}

/** Where a lock stands after these guesses. Guesses after a win are ignored. */
export function lockOutcome(guesses: Pattern[], answer: Pattern): LockOutcome {
  const key = answer.join();
  const solvedAt = guesses.findIndex((g) => g.join() === key);
  if (solvedAt >= 0) return { status: 'won', attempts: solvedAt + 1 };
  if (guesses.length >= MAX_ATTEMPTS) return { status: 'lost', attempts: MAX_ATTEMPTS };
  return { status: 'playing', attempts: guesses.length };
}

export type GuessProblem =
  | 'too-many-guesses'
  | 'invalid-pattern'
  | 'repeated-guess'
  | 'guess-after-solve';

/**
 * Checks a lock's guesses as the game would have accepted them: valid patterns of the right
 * length, no repeats, at most MAX_ATTEMPTS, nothing after the solving guess.
 */
export function checkGuesses(lockIndex: number, guesses: Pattern[], answer: Pattern): GuessProblem | null {
  const cfg = LOCKS[lockIndex]!;
  if (guesses.length > MAX_ATTEMPTS) return 'too-many-guesses';
  const seen = new Set<string>();
  for (const [i, g] of guesses.entries()) {
    if (!isValidPattern(cfg.n, g, cfg.len)) return 'invalid-pattern';
    const key = g.join();
    if (seen.has(key)) return 'repeated-guess';
    seen.add(key);
    if (key === answer.join() && i < guesses.length - 1) return 'guess-after-solve';
  }
  return null;
}

/** Share-text squares for one guess. */
export function emojiRow(guess: Pattern, answer: Pattern): string {
  return feedback(guess, answer)
    .map((c) => (c === Mark.Green ? '🟩' : c === Mark.Yellow ? '🟨' : '⬛'))
    .join('');
}
