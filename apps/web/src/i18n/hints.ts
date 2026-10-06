// Hint wording. Hints are specs from @pattern-lock/shared; each language words them with its own grammar.
import type { HintSpec, LineKind } from '@pattern-lock/shared';
import type { Lang } from './strings';

type HintWriter = (spec: HintSpec, n: number) => string;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function dotPlace(n: number, d: number) {
  const x = d % n, y = Math.floor(d / n), last = n - 1;
  const edgeX = x === 0 || x === last, edgeY = y === 0 || y === last;
  return { x, y, last, corner: edgeX && edgeY, center: !edgeX && !edgeY };
}

const en: HintWriter = (() => {
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  const ROWS: Record<number, string[]> = { 3: ['top', 'middle', 'bottom'], 4: ['top', 'second', 'third', 'bottom'] };
  const COLS: Record<number, string[]> = { 3: ['left', 'middle', 'right'], 4: ['left', 'second', 'third', 'right'] };
  const KINDS: Record<LineKind, [string, string]> = {
    d: ['diagonal line', 'diagonal lines'],
    h: ['horizontal line', 'horizontal lines'],
    v: ['vertical line', 'vertical lines'],
    o: ['slanted knight-style line', 'slanted knight-style lines'],
  };

  function dotName(n: number, d: number): string {
    const { x, y, last, corner, center } = dotPlace(n, d);
    if (corner) return `the ${y === 0 ? 'top' : 'bottom'}-${x === 0 ? 'left' : 'right'} corner`;
    if (n === 3) {
      if (center) return 'the center dot';
      if (y === 0 || y === last) return `the ${y === 0 ? 'top' : 'bottom'} middle dot`;
      return `the middle ${x === 0 ? 'left' : 'right'} dot`;
    }
    return `the dot in row ${y + 1}, column ${x + 1}`;
  }

  return (spec, n) => {
    const verb = spec.k.startsWith('start') ? 'Starts' : 'Ends';
    switch (spec.k) {
      case 'len': return `Uses ${spec.v} dots`;
      case 'startRegion': case 'endRegion':
        if (spec.v === 'corner') return `${verb} in a corner`;
        if (spec.v === 'edge') return `${verb} on an edge, not a corner`;
        return n === 3 ? `${verb} at the center dot` : `${verb} on one of the four middle dots`;
      case 'startRow': case 'endRow': return `${verb} on the ${ROWS[n]![spec.v]} row`;
      case 'startCol': case 'endCol': return `${verb} in the ${COLS[n]![spec.v]} column`;
      case 'kind': {
        const [one, many] = KINDS[spec.kind];
        if (spec.v === 0) return `Has no ${many}`;
        return `Has exactly ${NUM[spec.v]} ${plural(spec.v, one, many)}`;
      }
      case 'turns': return `Changes direction exactly ${NUM[spec.v]} times`;
      case 'avoid': return `Never touches ${dotName(n, spec.dot)}`;
      case 'step': return `Step ${spec.i + 1} is ${dotName(n, spec.dot)}`;
      case 'none': return '';
    }
  };
})();

const pt: HintWriter = (() => {
  // "linha" and "vez" are feminine, so the counts use feminine number words.
  const NUM_F = ['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'];
  const ROWS: Record<number, string[]> = {
    3: ['na linha de cima', 'na linha do meio', 'na linha de baixo'],
    4: ['na linha de cima', 'na segunda linha', 'na terceira linha', 'na linha de baixo'],
  };
  const COLS: Record<number, string[]> = {
    3: ['na coluna da esquerda', 'na coluna do meio', 'na coluna da direita'],
    4: ['na coluna da esquerda', 'na segunda coluna', 'na terceira coluna', 'na coluna da direita'],
  };
  const KINDS: Record<LineKind, [string, string]> = {
    d: ['linha diagonal', 'linhas diagonais'],
    h: ['linha horizontal', 'linhas horizontais'],
    v: ['linha vertical', 'linhas verticais'],
    o: ['linha inclinada em L, como o cavalo do xadrez', 'linhas inclinadas em L, como o cavalo do xadrez'],
  };

  // Every name takes the masculine article "o", so it fits any sentence below.
  function dotName(n: number, d: number): string {
    const { x, y, last, corner, center } = dotPlace(n, d);
    if (corner) return `o canto ${y === 0 ? 'superior' : 'inferior'} ${x === 0 ? 'esquerdo' : 'direito'}`;
    if (n === 3) {
      if (center) return 'o ponto central';
      if (y === 0 || y === last) return `o ponto do meio da linha ${y === 0 ? 'de cima' : 'de baixo'}`;
      return `o ponto do meio da coluna da ${x === 0 ? 'esquerda' : 'direita'}`;
    }
    return `o ponto da linha ${y + 1}, coluna ${x + 1}`;
  }

  return (spec, n) => {
    const verb = spec.k.startsWith('start') ? 'Começa' : 'Termina';
    switch (spec.k) {
      case 'len': return `Usa ${spec.v} pontos`;
      case 'startRegion': case 'endRegion':
        if (spec.v === 'corner') return `${verb} em um canto`;
        if (spec.v === 'edge') return `${verb} em uma borda, fora dos cantos`;
        return n === 3 ? `${verb} no ponto central` : `${verb} em um dos quatro pontos do meio`;
      case 'startRow': case 'endRow': return `${verb} ${ROWS[n]![spec.v]}`;
      case 'startCol': case 'endCol': return `${verb} ${COLS[n]![spec.v]}`;
      case 'kind': {
        const [one, many] = KINDS[spec.kind];
        if (spec.v === 0) return `Não tem ${many}`;
        return `Tem exatamente ${NUM_F[spec.v]} ${plural(spec.v, one, many)}`;
      }
      case 'turns': return `Muda de direção exatamente ${NUM_F[spec.v]} vezes`;
      case 'avoid': return `Nunca usa ${dotName(n, spec.dot)}`;
      case 'step': return `O ponto de ordem ${spec.i + 1} é ${dotName(n, spec.dot)}`;
      case 'none': return '';
    }
  };
})();

export const HINT_WRITERS: Record<Lang, HintWriter> = { en, pt };
