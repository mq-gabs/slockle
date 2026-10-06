import { MAX_ATTEMPTS, dayFromKey } from '@pattern-lock/shared';
import { z } from 'zod';

export const dateParam = z.string().refine((s) => dayFromKey(s) !== null, 'Expected a real YYYY-MM-DD date');

/** Random id the browser generates once; no accounts in v1. */
export const playerId = z.string().regex(/^[A-Za-z0-9-]{8,64}$/, 'Expected 8–64 letters, digits or dashes');

// Shape only; the game rules (valid patterns, lengths, repeats) are checked by ResultService.
const guess = z.array(z.number().int().min(0).max(15)).max(16);

export const submitBody = z.object({
  playerId,
  locks: z.array(z.object({ guesses: z.array(guess).max(MAX_ATTEMPTS + 1) })).max(10),
});

export const playerStatsQuery = z.object({ today: dateParam.optional() });
