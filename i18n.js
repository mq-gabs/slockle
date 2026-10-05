// Translations for Daily Pattern Lock. Add a language by adding an entry to LANGS, STRINGS and HINTS.
(function (root) {
  'use strict';

  const STORE_KEY = 'pattern-lock-lang';
  const LANGS = {
    en: { label: 'EN', name: 'English', locale: 'en' },
    pt: { label: 'PT', name: 'Português', locale: 'pt-BR' },
  };

  const plural = (n, one, many) => (n === 1 ? one : many);

  const STRINGS = {
    en: {
      'doc.title': 'Daily Pattern Lock',
      'aria.help': 'How to play',
      'aria.archive': 'Past puzzles',
      'aria.stats': 'Statistics',
      'aria.lang': 'Language',
      'aria.close': 'Close',
      'aria.locks': "Today's locks",
      'aria.grid': 'Pattern grid',
      'aria.thumbs': 'Past guesses',
      'aria.legend': 'Color key',

      'banner.past': 'Past puzzle',
      'banner.today': 'Back to today',

      'legend.g': 'Right step',
      'legend.y': 'Wrong step',
      'legend.x': 'Not in pattern',
      'mark.g': 'right step',
      'mark.y': 'wrong step',
      'mark.x': 'not in pattern',

      'play.preparing': 'Preparing the lock…',
      'play.lockInfo': (i, len) => `Lock ${i} of 3 · <strong>${len} dots</strong>`,
      'play.attempts': (n) => `<strong>${n}</strong> ${plural(n, 'attempt', 'attempts')} left`,
      'play.wrongLength': (len, got) => `Use exactly ${len} dots. That was ${got}, so no attempt used.`,
      'play.repeat': 'You already tried that pattern.',
      'play.firstTry': 'First try. Unlocked!',
      'play.unlocked': (n) => `Unlocked in ${n}!`,
      'play.lost': 'Locked out. Here is the pattern.',
      'play.next': 'Next lock →',
      'play.results': 'See results',
      'play.hints': 'Hints',
      'play.noHint': 'No new hint: your colors and hints already tell you more than another hint would.',
      'play.moreHints': 'Each miss unlocks another hint.',
      'tab.lock': (i) => `Lock ${i}`,

      'aria.answer': (dots) => `Answer: ${dots}`,
      'aria.lastGuess': (dots) => `Last guess: ${dots}. Drag to draw a new pattern.`,
      'aria.empty': (n, len) => `Empty ${n} by ${n} grid. Drag to draw a pattern of ${len} dots.`,
      'aria.guess': (k, dots) => `Guess ${k}: ${dots}`,
      'aria.lockAnswer': (i, dots) => `Lock ${i} answer: ${dots}`,

      'result.allOpen': 'All three locks open!',
      'result.some': (w) => `${w} of 3 locks opened`,
      'result.share': 'Share result',
      'result.next': 'Next puzzle in',
      'result.archiveNote': "Past puzzles don't count toward your stats or streak.",
      'result.archive': 'Past puzzles',
      'result.stats': 'Statistics',
      'result.today': "Back to today's puzzle",
      'toast.copied': 'Copied to clipboard',
      'toast.failed': 'Could not copy',

      'help.title': 'How to play',
      'help.intro': "Crack today's three hidden unlock patterns. Each lock gives you <strong>6 attempts</strong>.",
      'help.rule1': 'Drag across the dots to draw a pattern. Dots are used once, and a line passing over an unused dot picks it up.',
      'help.rule2': 'Order matters: 1→2→5 and 5→2→1 are different patterns.',
      'help.rule3': "You know the number of dots. A guess of the wrong length doesn't cost an attempt.",
      'help.rule4': 'After each miss you get a new hint, and they get more specific as you go.',
      'help.exampleTitle': 'Example',
      'help.example': 'The answer is 1→2→5→8→9 and you draw 1→5→9→8→7:',
      'help.exG': '1 and 8 are at the right step',
      'help.exY': '5 and 9 are in the pattern, at another step',
      'help.exX': '7 is not in the pattern',
      'help.fine': 'A new puzzle arrives at midnight. Everyone gets the same locks. Missed a day? Play it from the calendar button.',
      'help.play': 'Play',

      'stats.title': 'Statistics',
      'stats.played': 'Played',
      'stats.winRate': 'Win %',
      'stats.streak': 'Current streak',
      'stats.best': 'Best streak',
      'stats.dist': 'Attempts per lock',

      'archive.title': 'Past puzzles',
      'archive.note': "Every day has its own locks. Past puzzles don't count toward your stats or streak.",
      'archive.pick': 'Go to a date',
      'archive.today': 'Today',
      'archive.notPlayed': 'Not played',
      'archive.inProgress': (done) => `In progress · ${done}/3 locks`,
    },

    pt: {
      'doc.title': 'Pattern Lock Diário',
      'aria.help': 'Como jogar',
      'aria.archive': 'Desafios anteriores',
      'aria.stats': 'Estatísticas',
      'aria.lang': 'Idioma',
      'aria.close': 'Fechar',
      'aria.locks': 'Padrões do dia',
      'aria.grid': 'Grade do padrão',
      'aria.thumbs': 'Tentativas anteriores',
      'aria.legend': 'Legenda de cores',

      'banner.past': 'Desafio anterior',
      'banner.today': 'Voltar para hoje',

      'legend.g': 'Ordem certa',
      'legend.y': 'Ordem errada',
      'legend.x': 'Fora do padrão',
      'mark.g': 'ordem certa',
      'mark.y': 'ordem errada',
      'mark.x': 'fora do padrão',

      'play.preparing': 'Preparando o padrão…',
      'play.lockInfo': (i, len) => `Padrão ${i} de 3 · <strong>${len} pontos</strong>`,
      'play.attempts': (n) => `<strong>${n}</strong> ${plural(n, 'tentativa restante', 'tentativas restantes')}`,
      'play.wrongLength': (len, got) => `Use exatamente ${len} pontos. Foram ${got}, então nenhuma tentativa foi gasta.`,
      'play.repeat': 'Você já tentou esse padrão.',
      'play.firstTry': 'De primeira. Descoberto!',
      'play.unlocked': (n) => `Descoberto em ${n}!`,
      'play.lost': 'Bloqueado. Este era o padrão.',
      'play.next': 'Próximo padrão →',
      'play.results': 'Ver resultado',
      'play.hints': 'Dicas',
      'play.noHint': 'Sem dica nova: suas cores e dicas já dizem mais do que outra dica diria.',
      'play.moreHints': 'Cada erro libera uma nova dica.',
      'tab.lock': (i) => `Padrão ${i}`,

      'aria.answer': (dots) => `Resposta: ${dots}`,
      'aria.lastGuess': (dots) => `Última tentativa: ${dots}. Arraste para desenhar um novo padrão.`,
      'aria.empty': (n, len) => `Grade vazia de ${n} por ${n}. Arraste para desenhar um padrão de ${len} pontos.`,
      'aria.guess': (k, dots) => `Tentativa ${k}: ${dots}`,
      'aria.lockAnswer': (i, dots) => `Resposta do padrão ${i}: ${dots}`,

      'result.allOpen': 'Os três padrões descobertos!',
      'result.some': (w) => `${w} de 3 padrões descobertos`,
      'result.share': 'Compartilhar resultado',
      'result.next': 'Próximo desafio em',
      'result.archiveNote': 'Desafios anteriores não contam para suas estatísticas nem sequência.',
      'result.archive': 'Desafios anteriores',
      'result.stats': 'Estatísticas',
      'result.today': 'Voltar ao desafio de hoje',
      'toast.copied': 'Copiado!',
      'toast.failed': 'Não foi possível copiar',

      'help.title': 'Como jogar',
      'help.intro': 'Descubra os três padrões de desbloqueio escondidos de hoje. Cada padrão dá <strong>6 tentativas</strong>.',
      'help.rule1': 'Arraste pelos pontos para desenhar um padrão. Cada ponto é usado uma vez, e uma linha que passa por um ponto ainda não usado o inclui.',
      'help.rule2': 'A ordem importa: 1→2→5 e 5→2→1 são padrões diferentes.',
      'help.rule3': 'Você sabe quantos pontos o padrão tem. Uma tentativa com o número errado de pontos não conta.',
      'help.rule4': 'Cada erro libera uma nova dica, e elas ficam mais específicas a cada vez.',
      'help.exampleTitle': 'Exemplo',
      'help.example': 'A resposta é 1→2→5→8→9 e você desenha 1→5→9→8→7:',
      'help.exG': '1 e 8 estão na ordem certa',
      'help.exY': '5 e 9 estão no padrão, mas em outra ordem',
      'help.exX': '7 não está no padrão',
      'help.fine': 'Um novo desafio chega à meia-noite. Todo mundo recebe os mesmos padrões. Perdeu um dia? Jogue pelo botão de calendário.',
      'help.play': 'Jogar',

      'stats.title': 'Estatísticas',
      'stats.played': 'Jogos',
      'stats.winRate': '% de vitórias',
      'stats.streak': 'Sequência atual',
      'stats.best': 'Melhor sequência',
      'stats.dist': 'Tentativas em cada padrão',

      'archive.title': 'Desafios anteriores',
      'archive.note': 'Cada dia tem seus próprios padrões. Desafios anteriores não contam para suas estatísticas nem sequência.',
      'archive.pick': 'Ir para uma data',
      'archive.today': 'Hoje',
      'archive.notPlayed': 'Não jogado',
      'archive.inProgress': (done) => `Em andamento · ${done}/3 padrões`,
    },
  };

  // ---------- hint wording ----------
  // Hints are specs from logic.js ({ k, v, ... }); each language words them with its own grammar.

  function dotPlace(n, d) {
    const x = d % n, y = (d / n) | 0, last = n - 1;
    const edgeX = x === 0 || x === last, edgeY = y === 0 || y === last;
    return { x, y, last, corner: edgeX && edgeY, center: !edgeX && !edgeY };
  }

  const HINTS = {
    en: (() => {
      const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
      const ROWS = { 3: ['top', 'middle', 'bottom'], 4: ['top', 'second', 'third', 'bottom'] };
      const COLS = { 3: ['left', 'middle', 'right'], 4: ['left', 'second', 'third', 'right'] };
      const KINDS = {
        d: ['diagonal line', 'diagonal lines'],
        h: ['horizontal line', 'horizontal lines'],
        v: ['vertical line', 'vertical lines'],
        o: ['slanted knight-style line', 'slanted knight-style lines'],
      };

      function dotName(n, d) {
        const { x, y, last, corner, center } = dotPlace(n, d);
        if (corner) return `the ${y === 0 ? 'top' : 'bottom'}-${x === 0 ? 'left' : 'right'} corner`;
        if (n === 3) {
          if (center) return 'the center dot';
          if (y === 0 || y === last) return `the ${y === 0 ? 'top' : 'bottom'} middle dot`;
          return `the middle ${x === 0 ? 'left' : 'right'} dot`;
        }
        return `the dot in row ${y + 1}, column ${x + 1}`;
      }

      return function (spec, n) {
        const verb = spec.k.startsWith('start') ? 'Starts' : 'Ends';
        switch (spec.k) {
          case 'len': return `Uses ${spec.v} dots`;
          case 'startRegion': case 'endRegion':
            if (spec.v === 'corner') return `${verb} in a corner`;
            if (spec.v === 'edge') return `${verb} on an edge, not a corner`;
            return n === 3 ? `${verb} at the center dot` : `${verb} on one of the four middle dots`;
          case 'startRow': case 'endRow': return `${verb} on the ${ROWS[n][spec.v]} row`;
          case 'startCol': case 'endCol': return `${verb} in the ${COLS[n][spec.v]} column`;
          case 'kind': {
            const [one, many] = KINDS[spec.kind];
            if (spec.v === 0) return `Has no ${many}`;
            return `Has exactly ${NUM[spec.v]} ${plural(spec.v, one, many)}`;
          }
          case 'turns': return `Changes direction exactly ${NUM[spec.v]} times`;
          case 'avoid': return `Never touches ${dotName(n, spec.dot)}`;
          case 'step': return `Step ${spec.i + 1} is ${dotName(n, spec.dot)}`;
        }
        return '';
      };
    })(),

    pt: (() => {
      // "linha" and "vez" are feminine, so the counts use feminine number words.
      const NUM_F = ['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'];
      const ROWS = {
        3: ['na linha de cima', 'na linha do meio', 'na linha de baixo'],
        4: ['na linha de cima', 'na segunda linha', 'na terceira linha', 'na linha de baixo'],
      };
      const COLS = {
        3: ['na coluna da esquerda', 'na coluna do meio', 'na coluna da direita'],
        4: ['na coluna da esquerda', 'na segunda coluna', 'na terceira coluna', 'na coluna da direita'],
      };
      const KINDS = {
        d: ['linha diagonal', 'linhas diagonais'],
        h: ['linha horizontal', 'linhas horizontais'],
        v: ['linha vertical', 'linhas verticais'],
        o: ['linha inclinada em L, como o cavalo do xadrez', 'linhas inclinadas em L, como o cavalo do xadrez'],
      };

      // Every name takes the masculine article "o", so it fits any sentence below.
      function dotName(n, d) {
        const { x, y, last, corner, center } = dotPlace(n, d);
        if (corner) return `o canto ${y === 0 ? 'superior' : 'inferior'} ${x === 0 ? 'esquerdo' : 'direito'}`;
        if (n === 3) {
          if (center) return 'o ponto central';
          if (y === 0 || y === last) return `o ponto do meio da linha ${y === 0 ? 'de cima' : 'de baixo'}`;
          return `o ponto do meio da coluna da ${x === 0 ? 'esquerda' : 'direita'}`;
        }
        return `o ponto da linha ${y + 1}, coluna ${x + 1}`;
      }

      return function (spec, n) {
        const verb = spec.k.startsWith('start') ? 'Começa' : 'Termina';
        switch (spec.k) {
          case 'len': return `Usa ${spec.v} pontos`;
          case 'startRegion': case 'endRegion':
            if (spec.v === 'corner') return `${verb} em um canto`;
            if (spec.v === 'edge') return `${verb} em uma borda, fora dos cantos`;
            return n === 3 ? `${verb} no ponto central` : `${verb} em um dos quatro pontos do meio`;
          case 'startRow': case 'endRow': return `${verb} ${ROWS[n][spec.v]}`;
          case 'startCol': case 'endCol': return `${verb} ${COLS[n][spec.v]}`;
          case 'kind': {
            const [one, many] = KINDS[spec.kind];
            if (spec.v === 0) return `Não tem ${many}`;
            return `Tem exatamente ${NUM_F[spec.v]} ${plural(spec.v, one, many)}`;
          }
          case 'turns': return `Muda de direção exatamente ${NUM_F[spec.v]} vezes`;
          case 'avoid': return `Nunca usa ${dotName(n, spec.dot)}`;
          case 'step': return `O ponto de ordem ${spec.i + 1} é ${dotName(n, spec.dot)}`;
        }
        return '';
      };
    })(),
  };

  // ---------- language choice ----------

  function detect() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved && LANGS[saved]) return saved;
    } catch (e) { /* storage blocked: fall back to the browser language */ }
    const prefs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
    for (const p of prefs) {
      const code = String(p).toLowerCase().split('-')[0];
      if (LANGS[code]) return code;
    }
    return 'en';
  }

  let lang = detect();

  function setLang(code) {
    if (!LANGS[code]) return;
    lang = code;
    try { localStorage.setItem(STORE_KEY, code); } catch (e) { /* not saved, still switches */ }
  }

  function t(key, ...args) {
    const v = key in STRINGS[lang] ? STRINGS[lang][key] : STRINGS.en[key];
    return typeof v === 'function' ? v(...args) : v;
  }

  const hintText = (spec, n) => HINTS[lang](spec, n);

  // Fills static markup: data-i18n (text), data-i18n-html (trusted markup), data-i18n-aria (aria-label).
  function apply(doc) {
    doc.documentElement.lang = LANGS[lang].locale;
    for (const node of doc.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
    for (const node of doc.querySelectorAll('[data-i18n-html]')) node.innerHTML = t(node.dataset.i18nHtml);
    for (const node of doc.querySelectorAll('[data-i18n-aria]')) node.setAttribute('aria-label', t(node.dataset.i18nAria));
  }

  const api = {
    LANGS, STRINGS, t, hintText, apply, setLang,
    get lang() { return lang; },
    get locale() { return LANGS[lang].locale; },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PatternLockI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
