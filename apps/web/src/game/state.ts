import {
  LOCKS, dailyAnswer, dateKey, isLockSetReady, nextHint,
  type HintSpec, type LockStatus, type Pattern,
} from '@slockle/shared';
import { KEY_PREFIX, storage } from './storage';

export interface LockState {
  guesses: Pattern[];
  hints: HintSpec[];
  status: LockStatus;
}

/** One day's progress, saved in the browser under its own key. */
export interface DayState {
  day: number;
  /** Lock being played; LOCKS.length once all are done (results screen). */
  current: number;
  /** Today's result has been accepted by the server (always false for past days). */
  submitted: boolean;
  locks: LockState[];
}

export const stateKey = (day: number) => `${KEY_PREFIX}day-${dateKey(day)}`;

export function freshState(day: number): DayState {
  return {
    day,
    current: 0,
    submitted: false,
    locks: LOCKS.map(() => ({ guesses: [], hints: [], status: 'playing' })),
  };
}

export function loadState(day: number): DayState {
  const saved = storage.get<DayState | null>(stateKey(day), null);
  // Progress saved before the lock line-up changed doesn't fit the current locks; start over.
  if (!saved || saved.day !== day || !Array.isArray(saved.locks) || saved.locks.length !== LOCKS.length) {
    return freshState(day);
  }
  return { ...saved, submitted: Boolean(saved.submitted) };
}

export const saveState = (state: DayState) => storage.set(stateKey(state.day), state);

/** Answers need the lock's pattern list, which is slow to build the first time (the longest locks). */
export const isLockReady = (lock: number) => isLockSetReady(lock);

const answers = new Map<string, Pattern>();
export function answerFor(lock: number, day: number): Pattern {
  const key = `${lock}:${day}`;
  let a = answers.get(key);
  if (!a) answers.set(key, (a = dailyAnswer(lock, day)));
  return a;
}

/** Hints the player has earned: the starting ones plus one per miss (none after the last miss). */
function earnedHints(lockIndex: number, lock: LockState): number {
  const { startHints, attempts } = LOCKS[lockIndex]!;
  const misses = lock.status === 'won' ? lock.guesses.length - 1 : lock.guesses.length;
  return Math.min(startHints + misses, startHints + attempts - 1);
}

/** Returns the lock with any newly earned hints added (same object when nothing changed). */
export function withHints(lockIndex: number, day: number, lock: LockState): LockState {
  const target = earnedHints(lockIndex, lock);
  if (lock.hints.length >= target) return lock;
  const hints = [...lock.hints];
  const answer = answerFor(lockIndex, day);
  while (hints.length < target) {
    hints.push(nextHint(lockIndex, answer, lock.guesses, hints, hints.length) ?? { k: 'none' });
  }
  return { ...lock, hints };
}
