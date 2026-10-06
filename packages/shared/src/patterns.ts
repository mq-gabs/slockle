import { LOCKS } from './config.js';
import { countTurns, grid } from './grid.js';
import type { LockConfig, Pattern } from './types.js';

/** Every valid pattern of one length, packed into one array (len bytes per pattern). */
export interface PatternList {
  n: number;
  len: number;
  count: number;
  data: Uint8Array;
}

export function enumerate(n: number, len: number): PatternList {
  const { N, between } = grid(n);
  let data = new Uint8Array(1 << 16);
  let count = 0;
  const used = new Uint8Array(N);
  const path = new Uint8Array(len);

  function visit(depth: number): void {
    if (depth === len) {
      if ((count + 1) * len > data.length) {
        const bigger = new Uint8Array(data.length * 2);
        bigger.set(data);
        data = bigger;
      }
      data.set(path, count * len);
      count++;
      return;
    }
    const prev = path[depth - 1]!;
    for (let b = 0; b < N; b++) {
      if (used[b]) continue;
      if (depth > 0 && between[prev]![b]!.some((m) => !used[m])) continue;
      used[b] = 1;
      path[depth] = b;
      visit(depth + 1);
      used[b] = 0;
    }
  }
  visit(0);
  return { n, len, count, data: data.subarray(0, count * len) };
}

export interface LockSet {
  cfg: LockConfig;
  all: PatternList;
  /** Indices into `all` that may be a daily answer (quality filtered). */
  pool: Uint32Array;
}

const setCache = new Map<number, LockSet>();

/**
 * Full pattern list for a lock plus its answer pool. A 4×4 lock can have over a million
 * patterns and take a few hundred milliseconds to build, so the result is cached.
 */
export function lockSet(lockIndex: number): LockSet {
  const cached = setCache.get(lockIndex);
  if (cached) return cached;
  const cfg = LOCKS[lockIndex];
  if (!cfg) throw new RangeError(`No lock ${lockIndex}`);
  const all = enumerate(cfg.n, cfg.len);
  const minTurns = Math.min(2, cfg.len - 2);
  const pool: number[] = [];
  for (let i = 0; i < all.count; i++) {
    // Quality filter: at least two turns (which also rules out straight lines). A 3-dot pattern
    // can only turn once, so it just has to bend.
    if (countTurns(cfg.n, all.data.subarray(i * cfg.len, (i + 1) * cfg.len)) >= minTurns) pool.push(i);
  }
  const result = { cfg, all, pool: Uint32Array.from(pool) };
  setCache.set(lockIndex, result);
  return result;
}

export function isLockSetReady(lockIndex: number): boolean {
  return setCache.has(lockIndex);
}

export function patternAt(list: PatternList, i: number): Pattern {
  return Array.from(list.data.subarray(i * list.len, (i + 1) * list.len));
}
