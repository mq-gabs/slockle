import { dateKey, puzzleNumber } from './daily.js';
import { emojiRow } from './outcome.js';
import type { LockStatus, Pattern } from './types.js';

export interface ShareLock {
  status: LockStatus;
  guesses: Pattern[];
}

/** Spoiler-free result: scores for all locks, then one row of squares per guess of lock 3. */
export function shareText(day: number, locks: ShareLock[], answers: Pattern[]): string {
  const num = puzzleNumber(day);
  const title = num !== null ? `Pattern Lock #${num}` : `Pattern Lock ${dateKey(day)}`;
  const scores = locks.map((l) => (l.status === 'won' ? `🔓 ${l.guesses.length}/6` : '🔒 X/6'));
  const last = locks[locks.length - 1]!;
  const rows = last.guesses.map((g) => emojiRow(g, answers[answers.length - 1]!));
  return [title, scores.join('  '), ...rows].join('\n');
}
