import { DAY_MS, EPOCH } from './config.js';
import { lockSet, patternAt } from './patterns.js';
import type { Pattern } from './types.js';

/** A game day as a calendar date, YYYY-MM-DD. */
export type DayKey = string;

/** Day index in the player's local calendar; changes at local midnight. Day 0 is the epoch. */
export function dayNumber(date: Date): number {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((local - EPOCH) / DAY_MS);
}

/** Day index in UTC, for the server, which has no player time zone. */
export function utcDayNumber(date: Date): number {
  return Math.floor((date.getTime() - EPOCH) / DAY_MS);
}

export function dateKey(day: number): DayKey {
  return new Date(EPOCH + day * DAY_MS).toISOString().slice(0, 10);
}

/** Parses YYYY-MM-DD; null for anything else, including impossible dates like 2026-02-31. */
export function dayFromKey(key: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const day = Math.round((Date.parse(`${key}T00:00:00Z`) - EPOCH) / DAY_MS);
  return Number.isFinite(day) && dateKey(day) === key ? day : null;
}

/** Puzzle number shown to players; days before the epoch have none. */
export function puzzleNumber(day: number): number | null {
  return day >= 0 ? day + 1 : null;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The day's pattern for a lock, drawn from a seed built from the lock and the date, so any
 * day (past or future) can be regenerated on its own. Patterns can repeat across days.
 */
export function dailyAnswer(lockIndex: number, day: number): Pattern {
  const set = lockSet(lockIndex);
  const rand = mulberry32(hashString(`${set.cfg.seed}:${dateKey(day)}`));
  return patternAt(set.all, set.pool[Math.floor(rand() * set.pool.length)]!);
}
