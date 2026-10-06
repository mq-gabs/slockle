import { skippedDots, type Mark, type Pattern } from '@pattern-lock/shared';
import { useRef, useState, type PointerEvent } from 'react';
import { PatternGrid, dotPos, dotSpacing } from './PatternGrid';

interface DrawingBoardProps {
  n: number;
  enabled: boolean;
  /** What the grid shows when the player isn't drawing. */
  shown: { path: Pattern; marks?: Mark[] | null; tone: 'draw' | 'fb' | 'answer' };
  label: string;
  /** Bumped by the parent to replay the "rejected" shake. */
  shake: number;
  onDraw: (path: Pattern) => void;
}

/** The main grid: drag across dots to draw a pattern, release to submit it. */
export function DrawingBoard({ n, enabled, shown, label, shake, onDraw }: DrawingBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  // The path lives in a ref so fast pointer moves always extend the latest one; state is for rendering.
  const pathRef = useRef<Pattern | null>(null);
  const [drawing, setDrawing] = useState<{ path: Pattern; live: [number, number] | null } | null>(null);

  function toView(e: PointerEvent<SVGSVGElement>): [number, number] {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return [p.x, p.y];
  }

  function extend(e: PointerEvent<SVGSVGElement>) {
    const path = pathRef.current;
    if (!path) return;
    const [x, y] = toView(e);
    // Straight 4×4 lines like (3 across, 2 down) pass 0.28 spacings from other dots;
    // a smaller reach keeps every valid pattern drawable with a straight drag.
    const reach = dotSpacing(n) * 0.25;
    const used = new Set(path);
    const next = [...path];
    for (let d = 0; d < n * n; d++) {
      if (used.has(d)) continue;
      const [dx, dy] = dotPos(n, d);
      if (Math.hypot(dx - x, dy - y) > reach) continue;
      const last = next[next.length - 1];
      if (last !== undefined) next.push(...skippedDots(n, last, d, used));
      next.push(d);
      navigator.vibrate?.(8);
      break;
    }
    pathRef.current = next;
    setDrawing({ path: next, live: next.length ? [x, y] : null });
  }

  const finish = () => {
    const path = pathRef.current;
    if (!path) return;
    pathRef.current = null;
    setDrawing(null);
    if (path.length) onDraw(path);
  };

  return (
    <PatternGrid
      key={shake}
      svgRef={svgRef}
      n={n}
      className={`board-grid${shake ? ' shake' : ''}`}
      label={label}
      {...(drawing ? { path: drawing.path, live: drawing.path.length ? drawing.live : null } : shown)}
      onPointerDown={(e) => {
        if (!enabled) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pathRef.current = [];
        extend(e);
      }}
      onPointerMove={extend}
      onPointerUp={finish}
      onPointerCancel={finish}
    />
  );
}
