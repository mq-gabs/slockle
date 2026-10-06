import { LOCKS, type Pattern } from '@slockle/shared';
import { useCallback, useEffect, useState } from 'react';
import { answerFor, isLockReady, loadState, saveState, withHints, type DayState, type LockState } from './state';

export type GuessOutcome =
  | { kind: 'wrong-length'; len: number; got: number }
  | { kind: 'repeat' }
  | { kind: 'miss' }
  | { kind: 'won'; attempts: number }
  | { kind: 'lost' };

/** One day's game: saved progress, answers (built lazily), hints and the guess flow. */
export function useDayGame(day: number) {
  const [state, setState] = useState<DayState>(() => loadState(day));
  const [, setBuilt] = useState(0); // re-render once pattern lists finish building

  const needed = state.current < LOCKS.length ? [state.current] : LOCKS.map((_, i) => i);
  const neededKey = needed.join();
  const preparing = needed.some((i) => !isLockReady(i));

  // Building a long lock's list blocks for a moment; defer it so "Preparing…" renders first.
  useEffect(() => {
    if (!preparing) return;
    const timer = setTimeout(() => {
      neededKey.split(',').forEach((i) => answerFor(Number(i), day));
      setBuilt((n) => n + 1);
    }, 30);
    return () => clearTimeout(timer);
  }, [preparing, day, neededKey]);

  // Top up the current lock's hints once its answer is available.
  useEffect(() => {
    if (preparing || state.current >= LOCKS.length) return;
    const i = state.current;
    const lock = withHints(i, day, state.locks[i]!);
    if (lock !== state.locks[i]) setState((s) => ({ ...s, locks: s.locks.map((l, k) => (k === i ? lock : l)) }));
  }, [preparing, state, day]);

  useEffect(() => saveState(state), [state]);

  const answer = useCallback((i: number): Pattern | null => (isLockReady(i) ? answerFor(i, day) : null), [day]);

  const guess = useCallback((path: Pattern): GuessOutcome => {
    const i = state.current;
    const { len, attempts } = LOCKS[i]!;
    const lock = state.locks[i]!;
    if (path.length !== len) return { kind: 'wrong-length', len, got: path.length };
    if (lock.guesses.some((g) => g.join() === path.join())) return { kind: 'repeat' };

    const guesses = [...lock.guesses, path];
    const solved = path.join() === answerFor(i, day).join();
    const status = solved ? 'won' : guesses.length >= attempts ? 'lost' : 'playing';
    let next: LockState = { ...lock, guesses, status };
    if (status === 'playing') next = withHints(i, day, next);
    setState((s) => ({ ...s, locks: s.locks.map((l, k) => (k === i ? next : l)) }));

    if (solved) return { kind: 'won', attempts: guesses.length };
    return status === 'lost' ? { kind: 'lost' } : { kind: 'miss' };
  }, [state, day]);

  const nextLock = useCallback(() => setState((s) => ({ ...s, current: s.current + 1 })), []);
  const markSubmitted = useCallback(() => setState((s) => ({ ...s, submitted: true })), []);

  return { state, preparing, answer, guess, nextLock, markSubmitted };
}
