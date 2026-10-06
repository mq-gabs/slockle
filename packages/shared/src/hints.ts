import { feedback, matchesFeedback } from './feedback.js';
import { countKind, countTurns, region } from './grid.js';
import { lockSet } from './patterns.js';
import type { HintSpec, LineKind, Pattern, Region } from './types.js';

type Predicate = (p: ArrayLike<number>) => boolean;

export function hintTest(spec: HintSpec, n: number): Predicate {
  const last = (p: ArrayLike<number>) => p[p.length - 1]!;
  switch (spec.k) {
    case 'len': return () => true;
    case 'startRegion': return (p) => region(n, p[0]!) === spec.v;
    case 'endRegion': return (p) => region(n, last(p)) === spec.v;
    case 'startRow': return (p) => Math.floor(p[0]! / n) === spec.v;
    case 'endRow': return (p) => Math.floor(last(p) / n) === spec.v;
    case 'startCol': return (p) => p[0]! % n === spec.v;
    case 'endCol': return (p) => last(p) % n === spec.v;
    case 'kind': return (p) => countKind(n, p, spec.kind) === spec.v;
    case 'turns': return (p) => countTurns(n, p) === spec.v;
    case 'avoid': return (p) => !Array.prototype.includes.call(p, spec.dot);
    case 'step': return (p) => p[spec.i] === spec.dot;
    case 'none': return () => true;
  }
}

/** Candidate hints for one tier, all true for `answer`, most preferred first. */
function tierCandidates(tier: number, answer: Pattern, n: number): HintSpec[] {
  const first = answer[0]!, last = answer[answer.length - 1]!;
  switch (tier) {
    case 1: return [
      { k: 'startRegion', v: region(n, first) },
      { k: 'startRow', v: Math.floor(first / n) },
      { k: 'startCol', v: first % n },
    ];
    case 2: return (['d', 'h', 'v', 'o'] as LineKind[]).map((kind) => ({ k: 'kind', kind, v: countKind(n, answer, kind) }));
    case 3: return [
      { k: 'endRegion', v: region(n, last) },
      { k: 'endRow', v: Math.floor(last / n) },
      { k: 'endCol', v: last % n },
    ];
    case 4: {
      const rank: Record<Region, number> = { center: 0, corner: 1, edge: 2 };
      const missing: number[] = [];
      for (let d = 0; d < n * n; d++) if (!answer.includes(d)) missing.push(d);
      missing.sort((a, b) => rank[region(n, a)] - rank[region(n, b)] || a - b);
      return [
        ...missing.map((dot): HintSpec => ({ k: 'avoid', dot })),
        { k: 'turns', v: countTurns(n, answer) },
      ];
    }
    case 5: {
      // Middle steps first: they say the most about the route.
      const mid = (answer.length - 1) / 2;
      return answer
        .map((dot, i): HintSpec & { k: 'step' } => ({ k: 'step', i, dot }))
        .sort((a, b) => Math.abs(a.i - mid) - Math.abs(b.i - mid) || a.i - b.i);
    }
  }
  return [];
}

const sameSpec = (a: HintSpec, b: HintSpec) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Picks the next hint, or null when nothing useful is left.
 * `index` is the hint's position in the list (0 = dot count, 1 = start, 2 = shape, ...);
 * later hints come from more specific tiers. A candidate is skipped when it is redundant (every
 * pattern the player could still be facing already satisfies it) or too strong (together with the
 * hints already shown, it would leave a single pattern).
 */
export function nextHint(
  lockIndex: number,
  answer: Pattern,
  guesses: Pattern[],
  existing: HintSpec[],
  index: number,
): HintSpec | null {
  const set = lockSet(lockIndex);
  const { n, len } = set.cfg;
  if (index === 0) return { k: 'len', v: len };

  const shown = existing.filter((h) => h.k !== 'none');
  const tier = Math.min(index, 5);
  const order: number[] = [];
  for (let t = tier; t <= 5; t++) order.push(t);
  for (let t = 1; t < tier; t++) order.push(t);
  const candidates: HintSpec[] = [];
  for (const t of order) {
    for (const s of tierCandidates(t, answer, n)) {
      if (!shown.some((e) => sameSpec(e, s))) candidates.push(s);
    }
  }

  const tests = shown.map((s) => hintTest(s, n));
  const fbs = guesses.map((g) => feedback(g, answer));
  const { count, data } = set.all;

  for (const spec of candidates) {
    const test = hintTest(spec, n);
    let redundant = true;
    let matchesAlone = 0;
    for (let i = 0; i < count && (redundant || matchesAlone < 2); i++) {
      const o = i * len;
      const p = data.subarray(o, o + len);
      if (!tests.every((t) => t(p))) continue;
      const ok = test(p);
      if (ok) matchesAlone++;
      if (redundant && !ok) {
        let consistent = true;
        for (let g = 0; g < guesses.length && consistent; g++) {
          consistent = matchesFeedback(data, o, len, guesses[g]!, fbs[g]!);
        }
        if (consistent) redundant = false;
      }
    }
    if (!redundant && matchesAlone >= 2) return spec;
  }
  return null;
}
