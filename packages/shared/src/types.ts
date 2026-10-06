/** Dot indices, 0-based, left to right and top to bottom (dot "1" on screen is index 0). */
export type Pattern = number[];

export type GridSize = 3 | 4;

export interface LockConfig {
  /** Grid is n × n dots. */
  n: GridSize;
  /** Number of dots in the answer. */
  len: number;
  /** Hints shown before the first guess. */
  startHints: number;
  /** Seed prefix; combined with the date to pick the day's pattern. */
  seed: string;
}

/** Feedback for one dot of a guess. */
export const Mark = { Gray: 0, Yellow: 1, Green: 2 } as const;
export type Mark = (typeof Mark)[keyof typeof Mark];

export type LockStatus = 'playing' | 'won' | 'lost';

export type Region = 'corner' | 'edge' | 'center';

/** h horizontal, v vertical, d 45° diagonal, o any other slant ("knight-style"). */
export type LineKind = 'h' | 'v' | 'd' | 'o';

/**
 * A hint as data. The UI turns it into text per language; hintTest turns it into a predicate.
 * 'none' marks a slot where no useful hint was left.
 */
export type HintSpec =
  | { k: 'len'; v: number }
  | { k: 'startRegion' | 'endRegion'; v: Region }
  | { k: 'startRow' | 'endRow' | 'startCol' | 'endCol'; v: number }
  | { k: 'kind'; kind: LineKind; v: number }
  | { k: 'turns'; v: number }
  | { k: 'avoid'; dot: number }
  | { k: 'step'; i: number; dot: number }
  | { k: 'none' };
