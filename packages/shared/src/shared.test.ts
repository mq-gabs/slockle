import { describe, expect, it } from 'vitest';
import {
  Mark, checkGuesses, dailyAnswer, dateKey, dayFromKey, enumerate, feedback, hintTest, isValidPattern,
  lockOutcome, lockSet, nextHint, shareText, skippedDots,
} from './index.js';

describe('patterns', () => {
  it('matches the pattern counts in the spec', () => {
    expect(enumerate(3, 5).count).toBe(7152);
    expect(enumerate(3, 7).count).toBe(72912);
    expect(lockSet(2).all.count).toBe(1331944);
  });

  it('rejects jumps over unused dots but allows them over used ones', () => {
    expect(isValidPattern(3, [0, 2, 1, 4, 5], 5)).toBe(false); // 1→3 over unused 2
    expect(isValidPattern(3, [1, 0, 2, 5, 4], 5)).toBe(true); // 1→3 over used 2
    expect(isValidPattern(3, [0, 1, 1, 4, 5], 5)).toBe(false); // repeated dot
    expect(isValidPattern(3, [0, 1, 4], 5)).toBe(false); // wrong length
  });

  it('lists unused dots a move passes over', () => {
    expect(skippedDots(3, 0, 8, new Set([0]))).toEqual([4]);
    expect(skippedDots(4, 0, 15, new Set([0, 5]))).toEqual([10]);
  });
});

describe('feedback', () => {
  it('colors the worked example from the spec', () => {
    // answer 1→2→5→8→9, guess 1→5→9→8→7
    expect(feedback([0, 4, 8, 7, 6], [0, 1, 4, 7, 8])).toEqual([
      Mark.Green, Mark.Yellow, Mark.Yellow, Mark.Green, Mark.Gray,
    ]);
  });
});

describe('days', () => {
  it('round-trips dates and rejects impossible ones', () => {
    expect(dayFromKey('2026-10-05')).toBe(0);
    expect(dateKey(-1)).toBe('2026-10-04');
    expect(dayFromKey('2026-02-31')).toBeNull();
    expect(dayFromKey('junk')).toBeNull();
  });

  it('gives a stable, valid answer per lock and date', () => {
    for (const lock of [0, 1, 2]) {
      const a = dailyAnswer(lock, 12);
      expect(dailyAnswer(lock, 12)).toEqual(a);
      expect(isValidPattern(lockSet(lock).cfg.n, a, lockSet(lock).cfg.len)).toBe(true);
    }
    expect(dailyAnswer(0, 1)).not.toEqual(dailyAnswer(0, 2));
  });
});

describe('outcome', () => {
  const answer = [0, 1, 4, 7, 8];
  const miss = (i: number) => [[2, 1, 0, 3, 6], [6, 3, 0, 1, 2], [8, 7, 6, 3, 0], [2, 5, 8, 7, 6], [3, 4, 5, 2, 1], [6, 7, 8, 5, 2]][i]!;

  it('scores won, lost and unfinished locks', () => {
    expect(lockOutcome([miss(0), answer], answer)).toEqual({ status: 'won', attempts: 2 });
    expect(lockOutcome([0, 1, 2, 3, 4, 5].map(miss), answer)).toEqual({ status: 'lost', attempts: 6 });
    expect(lockOutcome([miss(0)], answer)).toEqual({ status: 'playing', attempts: 1 });
  });

  it('flags guesses the game would not have accepted', () => {
    expect(checkGuesses(0, [miss(0), answer], answer)).toBeNull();
    expect(checkGuesses(0, [miss(0), miss(0)], answer)).toBe('repeated-guess');
    expect(checkGuesses(0, [answer, miss(0)], answer)).toBe('guess-after-solve');
    expect(checkGuesses(0, [[0, 2, 1, 4, 5]], answer)).toBe('invalid-pattern');
    expect(checkGuesses(0, [0, 1, 2, 3, 4, 5, 0].map(miss), answer)).toBe('too-many-guesses');
  });
});

describe('hints', () => {
  it('starts with the dot count, and every hint is true for the answer', () => {
    const answer = dailyAnswer(1, 3);
    const hints = [nextHint(1, answer, [], [], 0)!];
    expect(hints[0]).toEqual({ k: 'len', v: 7 });
    for (let i = 1; i < 6; i++) {
      const h = nextHint(1, answer, [], hints, i);
      if (!h) break;
      expect(hintTest(h, 3)(answer)).toBe(true);
      hints.push(h);
    }
    expect(hints.length).toBeGreaterThan(2);
  });
});

describe('share text', () => {
  it('lists scores and lock 3 rows', () => {
    const answers = [[0], [0], [0, 1, 2, 5, 4, 3]];
    const text = shareText(11, [
      { status: 'won', guesses: [[0], [0], [0]] },
      { status: 'lost', guesses: [] },
      { status: 'won', guesses: [[0, 1, 2, 5, 4, 3]] },
    ], answers);
    expect(text).toBe('Pattern Lock #12\n🔓 3/6  🔒 X/6  🔓 1/6\n🟩🟩🟩🟩🟩🟩');
  });
});
