import { Mark, grid, type Pattern } from '@pattern-lock/shared';
import type { PointerEventHandler, Ref } from 'react';

const MARGIN = 16;

export function dotPos(n: number, d: number): [number, number] {
  const step = (100 - 2 * MARGIN) / (n - 1);
  return [MARGIN + (d % n) * step, MARGIN + Math.floor(d / n) * step];
}

export const dotSpacing = (n: number) => (100 - 2 * MARGIN) / (n - 1);

export interface PatternGridProps {
  n: number;
  path?: Pattern;
  /** Feedback per step of `path`; when set, dots show colour symbols. */
  marks?: Mark[] | null;
  /** draw: live path, fb: coloured feedback, answer: revealed solution. */
  tone?: 'draw' | 'fb' | 'answer';
  numbers?: boolean;
  arrows?: boolean;
  /** Smaller dot symbols, for thumbnails where lines and arrows need the room. */
  compact?: boolean;
  /** Pointer position while drawing, in viewBox units. */
  live?: [number, number] | null;
  className?: string;
  label?: string;
  svgRef?: Ref<SVGSVGElement>;
  onPointerDown?: PointerEventHandler<SVGSVGElement>;
  onPointerMove?: PointerEventHandler<SVGSVGElement>;
  onPointerUp?: PointerEventHandler<SVGSVGElement>;
  onPointerCancel?: PointerEventHandler<SVGSVGElement>;
}

export function PatternGrid({
  n, path = [], marks = null, tone = 'draw', numbers = true, arrows = false, compact = false, live = null,
  className = '', label, svgRef, ...pointer
}: PatternGridProps) {
  const k = compact ? 0.7 : 1;
  const pts = path.map((d) => dotPos(n, d));
  if (live) pts.push(live);

  return (
    <svg
      ref={svgRef}
      className={`grid ${className}`}
      viewBox="0 0 100 100"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...pointer}
    >
      {pts.length > 1 && <polyline points={pts.map((p) => p.join(',')).join(' ')} className={`g-line ${tone}`} />}
      {arrows && <Arrows n={n} path={path} />}
      {Array.from({ length: n * n }, (_, d) => {
        const [x, y] = dotPos(n, d);
        const step = path.indexOf(d);
        if (step < 0) return <circle key={d} cx={x} cy={y} r={3.2} className="g-dot" />;
        return (
          <g key={d}>
            {marks ? <MarkSymbol mark={marks[step]!} x={x} y={y} k={k} /> : (
              <circle cx={x} cy={y} r={6 * k} className={tone === 'answer' ? 'g-answer' : 'g-on'} />
            )}
            {numbers && (
              <>
                <circle cx={x + 7} cy={y - 7} r={4.2} className="badge" />
                <text x={x + 7} y={y - 6.8} className="badge-text">{step + 1}</text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Filled disc, ring, or cross, so the colours also read without colour vision. */
function MarkSymbol({ mark, x, y, k }: { mark: Mark; x: number; y: number; k: number }) {
  if (mark === Mark.Green) return <circle cx={x} cy={y} r={7 * k} className="fb-g" />;
  if (mark === Mark.Yellow) return <circle cx={x} cy={y} r={5.6 * k} className="fb-y" />;
  const c = 4.5 * k;
  return (
    <>
      <line x1={x - c} y1={y - c} x2={x + c} y2={y + c} className="fb-x" />
      <line x1={x - c} y1={y + c} x2={x + c} y2={y - c} className="fb-x" />
    </>
  );
}

/**
 * An arrowhead on each move, pointing the way it was drawn. It goes at the middle of a gap
 * between dots (a move over used dots has a dot at its midpoint), and slides along the line
 * when another arrow already sits there, as happens where moves cross or retrace.
 */
function Arrows({ n, path }: { n: number; path: Pattern }) {
  const size = n === 3 ? 6 : 4.5;
  const placed: [number, number][] = [];
  const polys: string[] = [];

  for (let i = 1; i < path.length; i++) {
    const [x1, y1] = dotPos(n, path[i - 1]!);
    const [x2, y2] = dotPos(n, path[i]!);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const gaps = grid(n).between[path[i - 1]!]![path[i]!]!.length + 1;
    // Candidate spots: gap centres first, then spreading out while staying clear of the dots.
    const room = Math.max(0, 0.5 / gaps - (size + 4) / len);
    const spots: number[] = [];
    for (let step = 0; step <= 6; step++) {
      for (let j = 0; j < gaps; j++) {
        const c = (j + 0.5) / gaps, d = (room * step) / 6;
        spots.push(c - d, c + d);
      }
    }
    const at = (t: number): [number, number] => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    const clearance = ([px, py]: [number, number]) =>
      Math.min(Infinity, ...placed.map(([qx, qy]) => Math.hypot(px - qx, py - qy)));
    let best = spots[0]!;
    for (const t of spots) {
      if (clearance(at(t)) >= size * 2.2) { best = t; break; }
      if (clearance(at(t)) > clearance(at(best))) best = t;
    }
    const [mx, my] = at(best);
    placed.push([mx, my]);

    const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    const pt = (along: number, side: number) => `${mx + ux * along - uy * side},${my + uy * along + ux * side}`;
    polys.push([pt(size, 0), pt(-size, size), pt(-size * 0.4, 0), pt(-size, -size)].join(' '));
  }
  return <>{polys.map((points, i) => <polygon key={i} points={points} className="g-arrow" />)}</>;
}
