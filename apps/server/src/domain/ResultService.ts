import {
  LOCKS, checkGuesses, dailyAnswer, dayFromKey, lockOutcome, utcDayNumber, type DayKey, type Pattern,
} from '@pattern-lock/shared';
import type { DayResultRepository } from '../persistence/DayResultRepository.js';
import type { DayResult, LockResult } from './DayResult.js';
import { DomainError } from './errors.js';

export type Clock = () => Date;

export interface SubmitInput {
  date: DayKey;
  playerId: string;
  locks: { guesses: Pattern[] }[];
}

export interface SubmitOutcome {
  /** False when the player had already submitted this day; `result` is then the stored one. */
  created: boolean;
  result: DayResult;
}

/**
 * Scores and stores a finished day. The client sends its guesses, not its score: the server
 * replays them against the day's answers, so a result can't claim a win it didn't earn.
 */
export class ResultService {
  constructor(
    private readonly repository: DayResultRepository,
    private readonly now: Clock = () => new Date(),
  ) {}

  async submit(input: SubmitInput): Promise<SubmitOutcome> {
    const day = dayFromKey(input.date);
    if (day === null) throw new DomainError(400, 'invalid-date', 'Date must be a real YYYY-MM-DD date.');

    // A day changes at the player's local midnight; across time zones "today" is one of
    // three UTC dates, so accept those and nothing else (past puzzles don't count toward stats).
    const today = utcDayNumber(this.now());
    if (day < today - 1 || day > today + 1) {
      throw new DomainError(422, 'date-not-current', "Only today's puzzle can be submitted.");
    }
    if (input.locks.length !== LOCKS.length) {
      throw new DomainError(400, 'wrong-lock-count', `Expected ${LOCKS.length} locks.`);
    }

    const locks: LockResult[] = input.locks.map(({ guesses }, i) => {
      const answer = dailyAnswer(i, day);
      const problem = checkGuesses(i, guesses, answer);
      if (problem) throw new DomainError(422, problem, `Lock ${i + 1} has guesses the game would not accept.`, { lock: i });
      const outcome = lockOutcome(guesses, answer);
      if (outcome.status === 'playing') {
        throw new DomainError(422, 'lock-unfinished', `Lock ${i + 1} is not finished.`, { lock: i });
      }
      return { status: outcome.status, attempts: outcome.attempts };
    });

    const result: DayResult = {
      date: input.date,
      playerId: input.playerId,
      locks,
      allOpened: locks.every((l) => l.status === 'won'),
      submittedAt: this.now(),
    };
    if (await this.repository.add(result)) return { created: true, result };
    const existing = await this.repository.find(input.date, input.playerId);
    return { created: false, result: existing ?? result };
  }
}
