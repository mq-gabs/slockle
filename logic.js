// Pure game logic for Daily Pattern Lock. No DOM access, so it also runs in Node for tests.
// Dots are 0-based internally (0..n*n-1), left to right, top to bottom.
(function (root) {
  'use strict';

  const LOCKS = [
    { n: 3, len: 5, startHints: 1, seed: 'pattern-lock-1' },
    { n: 3, len: 7, startHints: 1, seed: 'pattern-lock-2' },
    { n: 4, len: 6, startHints: 2, seed: 'pattern-lock-3' },
  ];
  const MAX_ATTEMPTS = 6;
  const EPOCH = Date.UTC(2026, 9, 5); // day 0 = puzzle #1

  const GREEN = 2, YELLOW = 1, GRAY = 0;

  // ---------- grid geometry ----------

  const gridCache = {};
  function grid(n) {
    if (gridCache[n]) return gridCache[n];
    const N = n * n;
    const between = [];
    for (let a = 0; a < N; a++) {
      between.push([]);
      for (let b = 0; b < N; b++) {
        const ax = a % n, ay = (a / n) | 0, bx = b % n, by = (b / n) | 0;
        const dx = bx - ax, dy = by - ay;
        const g = gcd(Math.abs(dx), Math.abs(dy));
        const mid = [];
        for (let k = 1; k < g; k++) mid.push((ay + (dy / g) * k) * n + ax + (dx / g) * k);
        between[a].push(mid);
      }
    }
    return (gridCache[n] = { n, N, between });
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  // Dots a move from `from` to `to` passes over that have not been used yet.
  // Phone locks add these automatically, which keeps every drawn path valid.
  function skippedDots(n, from, to, used) {
    return grid(n).between[from][to].filter((d) => !used.has(d));
  }

  // ---------- enumeration ----------

  // Every valid pattern of length `len`, packed into one Uint8Array (len bytes per pattern).
  function enumerate(n, len) {
    const { N, between } = grid(n);
    let data = new Uint8Array(1 << 16);
    let count = 0;
    const used = new Uint8Array(N);
    const path = new Uint8Array(len);

    function visit(depth) {
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
      const prev = path[depth - 1];
      for (let b = 0; b < N; b++) {
        if (used[b]) continue;
        if (depth > 0) {
          const mid = between[prev][b];
          let ok = true;
          for (let k = 0; k < mid.length; k++) if (!used[mid[k]]) { ok = false; break; }
          if (!ok) continue;
        }
        used[b] = 1;
        path[depth] = b;
        visit(depth + 1);
        used[b] = 0;
      }
    }
    visit(0);
    return { n, len, count, data: data.subarray(0, count * len) };
  }

  // ---------- shape measures ----------

  function segDir(n, a, b) {
    const dx = (b % n) - (a % n), dy = ((b / n) | 0) - ((a / n) | 0);
    const g = gcd(Math.abs(dx), Math.abs(dy));
    return [dx / g, dy / g];
  }

  // Line kind: 'h' horizontal, 'v' vertical, 'd' 45° diagonal, 'o' other slant.
  function segKind(n, a, b) {
    const dx = Math.abs((b % n) - (a % n)), dy = Math.abs(((b / n) | 0) - ((a / n) | 0));
    if (dy === 0) return 'h';
    if (dx === 0) return 'v';
    return dx === dy ? 'd' : 'o';
  }

  function countTurns(n, p) {
    let turns = 0;
    for (let i = 2; i < p.length; i++) {
      const d1 = segDir(n, p[i - 2], p[i - 1]), d2 = segDir(n, p[i - 1], p[i]);
      if (d1[0] !== d2[0] || d1[1] !== d2[1]) turns++;
    }
    return turns;
  }

  function countKind(n, p, kind) {
    let c = 0;
    for (let i = 1; i < p.length; i++) if (segKind(n, p[i - 1], p[i]) === kind) c++;
    return c;
  }

  function region(n, d) {
    const x = d % n, y = (d / n) | 0, last = n - 1;
    const edgeX = x === 0 || x === last, edgeY = y === 0 || y === last;
    if (edgeX && edgeY) return 'corner';
    if (edgeX || edgeY) return 'edge';
    return 'center';
  }

  // ---------- feedback ----------

  function feedback(guess, answer) {
    return guess.map((d, i) => (answer[i] === d ? GREEN : answer.includes(d) ? YELLOW : GRAY));
  }

  // Whether the packed pattern at data[o..o+len) would give `fb` for `guess`.
  function matchesFeedback(data, o, len, guess, fb) {
    for (let i = 0; i < len; i++) {
      const g = guess[i];
      let code;
      if (data[o + i] === g) code = GREEN;
      else {
        code = GRAY;
        for (let j = 0; j < len; j++) if (data[o + j] === g) { code = YELLOW; break; }
      }
      if (code !== fb[i]) return false;
    }
    return true;
  }

  // ---------- daily selection ----------

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Day index in the player's local calendar; changes at local midnight.
  function dayNumber(date) {
    const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((local - EPOCH) / 86400000);
  }

  // Calendar date (YYYY-MM-DD) for a day index, and back. Day 0 is the epoch.
  function dateKey(day) {
    return new Date(EPOCH + day * 86400000).toISOString().slice(0, 10);
  }

  function dayFromKey(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    const day = Math.round((Date.parse(key + 'T00:00:00Z') - EPOCH) / 86400000);
    return Number.isFinite(day) && dateKey(day) === key ? day : null;
  }

  const setCache = {};
  // Full pattern list for a lock, plus the answer pool (quality filtered).
  function lockSet(lockIndex) {
    if (setCache[lockIndex]) return setCache[lockIndex];
    const cfg = LOCKS[lockIndex];
    const all = enumerate(cfg.n, cfg.len);
    const pool = [];
    const p = new Array(cfg.len);
    for (let i = 0; i < all.count; i++) {
      for (let k = 0; k < cfg.len; k++) p[k] = all.data[i * cfg.len + k];
      if (countTurns(cfg.n, p) >= 2) pool.push(i);
    }
    return (setCache[lockIndex] = { cfg, all, pool: Uint32Array.from(pool) });
  }

  function patternAt(set, i) {
    const len = set.cfg.len;
    return Array.from(set.all.data.subarray(i * len, i * len + len));
  }

  // Each lock's pattern is drawn from a seed built from the lock and the date,
  // so any day (past or future) can be regenerated on its own.
  function dailyAnswer(lockIndex, day) {
    const set = lockSet(lockIndex);
    const rand = mulberry32(hashString(`${set.cfg.seed}:${dateKey(day)}`));
    return patternAt(set, set.pool[Math.floor(rand() * set.pool.length)]);
  }

  // ---------- hints ----------
  // A hint is stored as a plain spec object; i18n.js turns it into text, hintTest into a predicate.

  function hintTest(spec, n) {
    switch (spec.k) {
      case 'len': return () => true;
      case 'startRegion': return (p) => region(n, p[0]) === spec.v;
      case 'endRegion': return (p) => region(n, p[p.length - 1]) === spec.v;
      case 'startRow': return (p) => ((p[0] / n) | 0) === spec.v;
      case 'endRow': return (p) => ((p[p.length - 1] / n) | 0) === spec.v;
      case 'startCol': return (p) => p[0] % n === spec.v;
      case 'endCol': return (p) => p[p.length - 1] % n === spec.v;
      case 'kind': return (p) => countKind(n, p, spec.kind) === spec.v;
      case 'turns': return (p) => countTurns(n, p) === spec.v;
      case 'avoid': return (p) => !p.includes(spec.dot);
      case 'step': return (p) => p[spec.i] === spec.dot;
    }
    return () => false;
  }

  // Candidate hints for one tier, true for `answer`, most preferred first.
  function tierCandidates(tier, answer, n) {
    const first = answer[0], last = answer[answer.length - 1];
    switch (tier) {
      case 1: return [
        { k: 'startRegion', v: region(n, first) },
        { k: 'startRow', v: (first / n) | 0 },
        { k: 'startCol', v: first % n },
      ];
      case 2: return ['d', 'h', 'v', 'o'].map((kind) => ({ k: 'kind', kind, v: countKind(n, answer, kind) }));
      case 3: return [
        { k: 'endRegion', v: region(n, last) },
        { k: 'endRow', v: (last / n) | 0 },
        { k: 'endCol', v: last % n },
      ];
      case 4: {
        const rank = { center: 0, corner: 1, edge: 2 };
        const missing = [];
        for (let d = 0; d < n * n; d++) if (!answer.includes(d)) missing.push(d);
        missing.sort((a, b) => rank[region(n, a)] - rank[region(n, b)] || a - b);
        return missing.map((dot) => ({ k: 'avoid', dot }))
          .concat([{ k: 'turns', v: countTurns(n, answer) }]);
      }
      case 5: {
        // Middle steps first: they say the most about the route.
        const mid = (answer.length - 1) / 2;
        const steps = answer.map((dot, i) => ({ k: 'step', i, dot }));
        return steps.sort((a, b) => Math.abs(a.i - mid) - Math.abs(b.i - mid) || a.i - b.i);
      }
    }
    return [];
  }

  function sameSpec(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  // Picks the next hint, or null when nothing useful is left.
  // `index` is the hint's position in the list (0 = dot count, 1 = start, ...).
  // `guesses` are the player's past guesses for this lock.
  function nextHint(lockIndex, answer, guesses, existing, index) {
    const set = lockSet(lockIndex);
    const { n, len } = set.cfg;
    if (index === 0) return { k: 'len', v: len };

    const tier = Math.min(index, 5);
    const order = [];
    for (let t = tier; t <= 5; t++) order.push(t);
    for (let t = 1; t < tier; t++) order.push(t);
    const candidates = [];
    for (const t of order) for (const s of tierCandidates(t, answer, n)) {
      if (!existing.some((e) => sameSpec(e, s))) candidates.push(s);
    }

    const tests = existing.map((s) => hintTest(s, n));
    const fbs = guesses.map((g) => feedback(g, answer));
    const { count, data } = set.all;
    const p = new Array(len);

    for (const spec of candidates) {
      const test = hintTest(spec, n);
      // Redundant: every pattern the player can still be facing already satisfies it.
      let redundant = true;
      // Too strong: together with the other hints, it pins down a single pattern.
      let matchesAlone = 0;
      for (let i = 0; i < count && (redundant || matchesAlone < 2); i++) {
        const o = i * len;
        for (let k = 0; k < len; k++) p[k] = data[o + k];
        if (!tests.every((t) => t(p))) continue;
        const ok = test(p);
        if (ok) matchesAlone++;
        if (redundant && !ok) {
          let consistent = true;
          for (let g = 0; g < guesses.length && consistent; g++) {
            consistent = matchesFeedback(data, o, len, guesses[g], fbs[g]);
          }
          if (consistent) redundant = false;
        }
      }
      if (!redundant && matchesAlone >= 2) return spec;
    }
    return null;
  }

  // ---------- share text ----------

  function shareText(day, locks, answers) {
    const title = day >= 0 ? `Pattern Lock #${day + 1}` : `Pattern Lock ${dateKey(day)}`;
    const scores = locks.map((l) => (l.status === 'won' ? `🔓 ${l.guesses.length}/6` : '🔒 X/6'));
    const rows = locks[2].guesses.map((g) =>
      feedback(g, answers[2]).map((c) => (c === GREEN ? '🟩' : c === YELLOW ? '🟨' : '⬛')).join(''));
    return [title, scores.join('  ')].concat(rows).join('\n');
  }

  const api = {
    LOCKS, MAX_ATTEMPTS, GREEN, YELLOW, GRAY,
    grid, skippedDots, enumerate, countTurns, countKind, region, feedback,
    dayNumber, dateKey, dayFromKey, lockSet, dailyAnswer, nextHint, hintTest, shareText,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PatternLock = api;
})(typeof window !== 'undefined' ? window : globalThis);
