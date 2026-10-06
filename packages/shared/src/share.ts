import { dateKey, puzzleNumber } from './daily.js';
import { emojiRow, scoreText } from './outcome.js';
import type { LockStatus, Pattern } from './types.js';

export interface ShareLock {
  status: LockStatus;
  guesses: Pattern[];
}

/** Spoiler-free result: scores for all locks, then one row of squares per guess of the last lock. */
export function shareText(day: number, locks: ShareLock[], answers: Pattern[]): string {
  const num = puzzleNumber(day);
  const title = num !== null ? `Slockle #${num}` : `Slockle ${dateKey(day)}`;
  const scores = locks.map((l, i) => `${l.status === 'won' ? '🔓' : '🔒'} ${scoreText(i, l.status, l.guesses.length)}`);
  const last = locks[locks.length - 1]!;
  const rows = last.guesses.map((g) => emojiRow(g, answers[answers.length - 1]!));
  return [title, scores.join('  '), ...rows].join('\n');
}
