import { Mark, type Pattern } from './types.js';

/** Green: right dot at this step. Yellow: in the pattern at another step. Gray: not in it. */
export function feedback(guess: Pattern, answer: Pattern): Mark[] {
  return guess.map((d, i) => (answer[i] === d ? Mark.Green : answer.includes(d) ? Mark.Yellow : Mark.Gray));
}

/** Whether the packed pattern at data[o..o+len) would give `fb` for `guess`. */
export function matchesFeedback(data: Uint8Array, o: number, len: number, guess: Pattern, fb: Mark[]): boolean {
  for (let i = 0; i < len; i++) {
    const g = guess[i];
    let code: Mark;
    if (data[o + i] === g) code = Mark.Green;
    else {
      code = Mark.Gray;
      for (let j = 0; j < len; j++) {
        if (data[o + j] === g) {
          code = Mark.Yellow;
          break;
        }
      }
    }
    if (code !== fb[i]) return false;
  }
  return true;
}
