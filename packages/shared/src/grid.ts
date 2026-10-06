import type { GridSize, LineKind, Pattern, Region } from './types.js';

export interface Grid {
  n: number;
  N: number;
  /** between[a][b]: dots strictly between a and b on the straight line from a to b. */
  between: number[][][];
}

const gridCache = new Map<number, Grid>();

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export function grid(n: number): Grid {
  const cached = gridCache.get(n);
  if (cached) return cached;
  const N = n * n;
  const between: number[][][] = [];
  for (let a = 0; a < N; a++) {
    const row: number[][] = [];
    for (let b = 0; b < N; b++) {
      const ax = a % n, ay = Math.floor(a / n), bx = b % n, by = Math.floor(b / n);
      const dx = bx - ax, dy = by - ay;
      const g = gcd(Math.abs(dx), Math.abs(dy));
      const mid: number[] = [];
      for (let k = 1; k < g; k++) mid.push((ay + (dy / g) * k) * n + ax + (dx / g) * k);
      row.push(mid);
    }
    between.push(row);
  }
  const result = { n, N, between };
  gridCache.set(n, result);
  return result;
}

/**
 * Dots a move from `from` to `to` passes over that have not been used yet.
 * Phone locks add these automatically, which keeps every drawn path valid.
 */
export function skippedDots(n: number, from: number, to: number, used: ReadonlySet<number>): number[] {
  return grid(n).between[from]![to]!.filter((d) => !used.has(d));
}

/** Each dot once, and no jumping over a dot that has not been used yet. */
export function isValidPattern(n: GridSize, p: Pattern, len: number): boolean {
  if (p.length !== len) return false;
  const used = new Set<number>();
  for (let i = 0; i < p.length; i++) {
    const d = p[i]!;
    if (!Number.isInteger(d) || d < 0 || d >= n * n || used.has(d)) return false;
    if (i > 0 && grid(n).between[p[i - 1]!]![d]!.some((m) => !used.has(m))) return false;
    used.add(d);
  }
  return true;
}

function segDir(n: number, a: number, b: number): [number, number] {
  const dx = (b % n) - (a % n), dy = Math.floor(b / n) - Math.floor(a / n);
  const g = gcd(Math.abs(dx), Math.abs(dy));
  return [dx / g, dy / g];
}

export function segKind(n: number, a: number, b: number): LineKind {
  const dx = Math.abs((b % n) - (a % n)), dy = Math.abs(Math.floor(b / n) - Math.floor(a / n));
  if (dy === 0) return 'h';
  if (dx === 0) return 'v';
  return dx === dy ? 'd' : 'o';
}

export function countTurns(n: number, p: ArrayLike<number>): number {
  let turns = 0;
  for (let i = 2; i < p.length; i++) {
    const d1 = segDir(n, p[i - 2]!, p[i - 1]!), d2 = segDir(n, p[i - 1]!, p[i]!);
    if (d1[0] !== d2[0] || d1[1] !== d2[1]) turns++;
  }
  return turns;
}

export function countKind(n: number, p: ArrayLike<number>, kind: LineKind): number {
  let c = 0;
  for (let i = 1; i < p.length; i++) if (segKind(n, p[i - 1]!, p[i]!) === kind) c++;
  return c;
}

export function region(n: number, d: number): Region {
  const x = d % n, y = Math.floor(d / n), last = n - 1;
  const edgeX = x === 0 || x === last, edgeY = y === 0 || y === last;
  if (edgeX && edgeY) return 'corner';
  if (edgeX || edgeY) return 'edge';
  return 'center';
}
