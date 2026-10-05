// UI for Daily Pattern Lock: drawing, rendering, saved progress, stats and sharing.
(function () {
  'use strict';

  const PL = window.PatternLock;
  const { LOCKS, MAX_ATTEMPTS, GREEN, YELLOW } = PL;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const OLD_STATE_KEY = 'pattern-lock-state';
  const ARCHIVE_LIST_DAYS = 30;
  const STATS_KEY = 'pattern-lock-stats';
  const SEEN_KEY = 'pattern-lock-seen-help';

  const $ = (id) => document.getElementById(id);
  const today = PL.dayNumber(new Date());
  // ?d=YYYY-MM-DD plays a past day's puzzle; anything else (or a future date) plays today's.
  const requested = PL.dayFromKey(new URLSearchParams(location.search).get('d') || '');
  const day = requested !== null && requested < today ? requested : today;
  const isArchive = day !== today;

  // ---------- storage ----------

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: play without saving */ }
  }

  // Each day's progress lives under its own key, so archive games never touch today's.
  const stateKey = (d) => `pattern-lock-day-${PL.dateKey(d)}`;

  function freshState() {
    return {
      day,
      current: 0,
      recorded: false,
      locks: LOCKS.map(() => ({ guesses: [], hints: [], status: 'playing' })),
    };
  }

  const legacy = load(OLD_STATE_KEY, null); // saved before progress was kept per day
  if (legacy) {
    if (legacy.day === today && !load(stateKey(today), null)) save(stateKey(today), legacy);
    try { localStorage.removeItem(OLD_STATE_KEY); } catch (e) { /* ignore */ }
  }

  let state = load(stateKey(day), null);
  if (!state || state.day !== day) state = freshState();

  let stats = load(STATS_KEY, null) || { played: 0, won: 0, streak: 0, best: 0, lastWon: null, dist: [0, 0, 0, 0, 0, 0, 0] };

  const persist = () => save(stateKey(day), state);

  // ---------- puzzle data ----------

  const answers = [];
  const answer = (i) => answers[i] || (answers[i] = PL.dailyAnswer(i, day));
  const lock = () => state.locks[state.current];
  const cfg = () => LOCKS[state.current];

  // Lock 3 has 1.3M patterns; building its list blocks for a moment, so show a message first.
  function prepare(indices, done) {
    const missing = indices.filter((i) => !answers[i]);
    if (!missing.length) return done();
    $('msg').textContent = 'Preparing the lock…';
    setTimeout(() => {
      missing.forEach(answer);
      $('msg').textContent = '';
      done();
    }, 30);
  }

  // Fills the hint list up to what the player has earned so far.
  function ensureHints(i) {
    const l = state.locks[i];
    const misses = l.status === 'won' ? l.guesses.length - 1 : l.guesses.length;
    const earned = Math.min(LOCKS[i].startHints + misses, LOCKS[i].startHints + MAX_ATTEMPTS - 1);
    while (l.hints.length < earned) {
      const spec = PL.nextHint(i, answer(i), l.guesses, l.hints.filter((h) => h.k !== 'none'), l.hints.length);
      l.hints.push(spec || { k: 'none' });
    }
  }

  // ---------- svg drawing ----------

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function dotPos(n, d) {
    const margin = 16, step = (100 - 2 * margin) / (n - 1);
    return [margin + (d % n) * step, margin + Math.floor(d / n) * step];
  }

  // tone: 'draw' (live path), 'fb' (colored feedback), 'answer' (revealed solution)
  function drawGrid(svg, n, { path = [], marks = null, tone = 'draw', numbers = true, live = null } = {}) {
    svg.replaceChildren();
    const pts = path.map((d) => dotPos(n, d));
    if (live) pts.push(live);
    if (pts.length > 1) {
      el('polyline', { points: pts.map((p) => p.join(',')).join(' '), class: `g-line ${tone}` }, svg);
    }
    for (let d = 0; d < n * n; d++) {
      const [x, y] = dotPos(n, d);
      const step = path.indexOf(d);
      if (step < 0) {
        el('circle', { cx: x, cy: y, r: 3.2, class: 'g-dot' }, svg);
        continue;
      }
      if (marks) {
        const m = marks[step];
        if (m === GREEN) el('circle', { cx: x, cy: y, r: 7, class: 'fb-g' }, svg);
        else if (m === YELLOW) el('circle', { cx: x, cy: y, r: 5.6, class: 'fb-y' }, svg);
        else {
          el('line', { x1: x - 4.5, y1: y - 4.5, x2: x + 4.5, y2: y + 4.5, class: 'fb-x' }, svg);
          el('line', { x1: x - 4.5, y1: y + 4.5, x2: x + 4.5, y2: y - 4.5, class: 'fb-x' }, svg);
        }
      } else {
        el('circle', { cx: x, cy: y, r: 6, class: tone === 'answer' ? 'g-answer' : 'g-on' }, svg);
      }
      if (numbers) {
        el('circle', { cx: x + 7, cy: y - 7, r: 4.2, class: 'badge' }, svg);
        el('text', { x: x + 7, y: y - 6.8, class: 'badge-text' }, svg).textContent = step + 1;
      }
    }
  }

  function miniGrid(n, opts, label) {
    const svg = el('svg', { viewBox: '0 0 100 100', class: 'grid', role: 'img', 'aria-label': label });
    drawGrid(svg, n, opts);
    return svg;
  }

  function describe(path, marks) {
    const words = { [GREEN]: 'right step', [YELLOW]: 'wrong step', 0: 'not in pattern' };
    return path.map((d, i) => `${d + 1}${marks ? ` (${words[marks[i]]})` : ''}`).join(', ');
  }

  // ---------- drawing input ----------

  const gridSvg = $('grid');
  let drawing = null; // { path, used, live } while the pointer is down

  function canDraw() {
    return state.current < LOCKS.length && lock().status === 'playing' && answers[state.current];
  }

  function toView(e) {
    const pt = gridSvg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(gridSvg.getScreenCTM().inverse());
    return [p.x, p.y];
  }

  function extend(e) {
    const { n } = cfg();
    const [x, y] = toView(e);
    drawing.live = [x, y];
    // Straight 4×4 lines like (3 across, 2 down) pass 0.28 spacings from other dots;
    // a smaller reach keeps every valid pattern drawable with a straight drag.
    const reach = ((100 - 32) / (n - 1)) * 0.25;
    for (let d = 0; d < n * n; d++) {
      if (drawing.used.has(d)) continue;
      const [dx, dy] = dotPos(n, d);
      if (Math.hypot(dx - x, dy - y) > reach) continue;
      const path = drawing.path;
      if (path.length) {
        for (const m of PL.skippedDots(n, path[path.length - 1], d, drawing.used)) {
          path.push(m);
          drawing.used.add(m);
        }
      }
      path.push(d);
      drawing.used.add(d);
      if (navigator.vibrate) navigator.vibrate(8);
      break;
    }
    drawGrid(gridSvg, n, { path: drawing.path, live: drawing.path.length ? drawing.live : null });
  }

  gridSvg.addEventListener('pointerdown', (e) => {
    if (!canDraw()) return;
    e.preventDefault();
    gridSvg.setPointerCapture(e.pointerId);
    drawing = { path: [], used: new Set(), live: null };
    $('msg').textContent = '';
    extend(e);
  });

  gridSvg.addEventListener('pointermove', (e) => {
    if (drawing) extend(e);
  });

  const endDraw = () => {
    if (!drawing) return;
    const path = drawing.path;
    drawing = null;
    if (path.length) submit(path);
    else renderPlay();
  };
  gridSvg.addEventListener('pointerup', endDraw);
  gridSvg.addEventListener('pointercancel', endDraw);

  function reject(text) {
    renderPlay();
    $('msg').textContent = text;
    gridSvg.classList.remove('shake');
    void gridSvg.getBoundingClientRect();
    gridSvg.classList.add('shake');
  }

  function submit(path) {
    const { len } = cfg();
    const l = lock();
    if (path.length !== len) {
      return reject(`Use exactly ${len} dots. That was ${path.length}, so no attempt used.`);
    }
    if (l.guesses.some((g) => g.join() === path.join())) {
      return reject('You already tried that pattern.');
    }
    l.guesses.push(path);
    const solved = path.join() === answer(state.current).join();
    if (solved) l.status = 'won';
    else if (l.guesses.length >= MAX_ATTEMPTS) l.status = 'lost';
    else ensureHints(state.current);
    persist();
    renderPlay(true);
    if (solved) $('msg').textContent = l.guesses.length === 1 ? 'First try. Unlocked!' : `Unlocked in ${l.guesses.length}!`;
    else if (l.status === 'lost') $('msg').textContent = 'Locked out. Here is the pattern.';
  }

  // ---------- rendering ----------

  function renderTabs() {
    const nav = $('locks');
    nav.replaceChildren();
    LOCKS.forEach((c, i) => {
      const l = state.locks[i];
      const pill = document.createElement('div');
      let cls = 'lock-pill';
      let text = `Lock ${i + 1} · ${c.n}×${c.n}`;
      if (l.status === 'won') { cls += ' won'; text = `Lock ${i + 1} · ${l.guesses.length}/6`; }
      else if (l.status === 'lost') { cls += ' lost'; text = `Lock ${i + 1} · X/6`; }
      if (i === state.current) cls += ' current';
      pill.className = cls;
      pill.textContent = text;
      nav.appendChild(pill);
    });
  }

  function renderPlay(newHint) {
    $('play').hidden = false;
    $('result').hidden = true;
    renderTabs();
    const i = state.current;
    const { n, len } = LOCKS[i];
    const l = lock();
    const ans = answers[i];

    $('lock-info').innerHTML = `Lock ${i + 1} of 3 · <strong>${len} dots</strong>`;
    const left = MAX_ATTEMPTS - l.guesses.length;
    $('attempts').innerHTML = l.status === 'playing'
      ? `<strong>${left}</strong> attempt${left === 1 ? '' : 's'} left`
      : '';

    // Main grid: revealed answer, else the last guess's colors, else empty.
    const last = l.guesses[l.guesses.length - 1];
    if (!ans) drawGrid(gridSvg, n);
    else if (l.status !== 'playing') {
      drawGrid(gridSvg, n, { path: ans, tone: 'answer' });
      gridSvg.setAttribute('aria-label', `Answer: ${describe(ans)}`);
    } else if (last) {
      const marks = PL.feedback(last, ans);
      drawGrid(gridSvg, n, { path: last, marks, tone: 'fb' });
      gridSvg.setAttribute('aria-label', `Last guess: ${describe(last, marks)}. Drag to draw a new pattern.`);
    } else {
      drawGrid(gridSvg, n);
      gridSvg.setAttribute('aria-label', `Empty ${n} by ${n} grid. Drag to draw a pattern of ${len} dots.`);
    }

    const thumbs = $('thumbs');
    thumbs.replaceChildren();
    if (ans) {
      l.guesses.forEach((g, k) => {
        const marks = PL.feedback(g, ans);
        thumbs.appendChild(miniGrid(n, { path: g, marks, tone: 'fb', numbers: false }, `Guess ${k + 1}: ${describe(g, marks)}`));
      });
    }

    const end = $('lock-end');
    end.hidden = l.status === 'playing';
    $('next-btn').textContent = i < LOCKS.length - 1 ? 'Next lock →' : 'See results';

    const list = $('hints');
    list.replaceChildren();
    l.hints.forEach((h, k) => {
      if (h.k === 'none' && l.hints[k - 1].k === 'none') return;
      const li = document.createElement('li');
      li.textContent = h.k === 'none'
        ? 'No new hint: your colors and hints already tell you more than another hint would.'
        : PL.hintText(h, n);
      if (newHint && k === l.hints.length - 1 && l.guesses.length) li.className = 'new';
      list.appendChild(li);
    });
    if (l.status === 'playing' && l.guesses.length < MAX_ATTEMPTS - 1) {
      const li = document.createElement('li');
      li.className = 'locked';
      li.textContent = 'Each miss unlocks another hint.';
      list.appendChild(li);
    }
  }

  function renderResult() {
    $('play').hidden = true;
    $('result').hidden = false;
    state.current = LOCKS.length;
    renderTabs();

    const wins = state.locks.filter((l) => l.status === 'won').length;
    $('result-title').textContent = wins === 3 ? 'All three locks open!' : `${wins} of 3 locks opened`;

    const box = $('result-locks');
    box.replaceChildren();
    LOCKS.forEach((c, i) => {
      const l = state.locks[i];
      const wrap = document.createElement('div');
      wrap.className = 'result-lock';
      wrap.appendChild(miniGrid(c.n, { path: answer(i), tone: 'answer' }, `Lock ${i + 1} answer: ${describe(answer(i))}`));
      const p = document.createElement('p');
      p.textContent = l.status === 'won' ? `${l.guesses.length}/6` : 'X/6';
      if (l.status !== 'won') p.className = 'lost';
      wrap.appendChild(p);
      box.appendChild(wrap);
    });
    $('countdown-row').hidden = isArchive;
    $('archive-actions').hidden = !isArchive;
    if (!isArchive) tickCountdown();
  }

  function render() {
    if (state.current >= LOCKS.length) prepare([0, 1, 2], () => { recordDay(); renderResult(); });
    else {
      renderPlay();
      prepare([state.current], () => {
        ensureHints(state.current);
        persist();
        renderPlay();
      });
    }
  }

  // ---------- day end, stats, share ----------

  // Only today's puzzle counts toward stats and streaks; archive games are just for fun.
  function recordDay() {
    if (state.recorded || isArchive) return;
    const allWon = state.locks.every((l) => l.status === 'won');
    stats.played++;
    state.locks.forEach((l) => { stats.dist[l.status === 'won' ? l.guesses.length - 1 : 6]++; });
    if (allWon) {
      stats.won++;
      stats.streak = stats.lastWon === today - 1 ? stats.streak + 1 : 1;
      stats.lastWon = today;
      stats.best = Math.max(stats.best, stats.streak);
    } else {
      stats.streak = 0;
    }
    state.recorded = true;
    save(STATS_KEY, stats);
    persist();
  }

  // A streak only survives if yesterday (or today) was fully solved.
  const liveStreak = () => (stats.lastWon !== null && stats.lastWon >= today - 1 ? stats.streak : 0);

  $('next-btn').addEventListener('click', () => {
    state.current++;
    if (state.current >= LOCKS.length) {
      prepare([0, 1, 2], () => {
        recordDay();
        renderResult();
        if (!isArchive) setTimeout(openStats, 600);
      });
    } else {
      persist();
      render();
    }
  });

  function openStats() {
    const row = $('stat-row');
    const winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;
    row.innerHTML = [
      [stats.played, 'Played'],
      [winRate, 'Win %'],
      [liveStreak(), 'Current streak'],
      [stats.best, 'Best streak'],
    ].map(([v, label]) => `<div><strong>${v}</strong><span>${label}</span></div>`).join('');

    const dist = $('dist');
    const max = Math.max(1, ...stats.dist);
    const todays = state.recorded && !isArchive
      ? state.locks.map((l) => (l.status === 'won' ? l.guesses.length - 1 : 6))
      : [];
    dist.innerHTML = stats.dist.map((v, k) => {
      const hl = todays.includes(k) ? ' hl' : '';
      return `<div class="dist-row"><span>${k === 6 ? 'X' : k + 1}</span>`
        + `<div class="dist-bar${hl}" style="width:${Math.max(8, (v / max) * 100)}%">${v}</div></div>`;
    }).join('');
    $('stats').showModal();
  }

  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 1800);
  }

  $('share-btn').addEventListener('click', async () => {
    const text = PL.shareText(day, state.locks, [0, 1, 2].map(answer));
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch (e) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      toast(ok ? 'Copied to clipboard' : 'Could not copy');
    }
  });

  function tickCountdown() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = midnight - now;
    if (ms <= 0 || PL.dayNumber(now) !== today) return location.reload();
    const s = Math.floor(ms / 1000);
    const pad = (v) => String(v).padStart(2, '0');
    $('countdown').textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }
  setInterval(() => { if (!isArchive && !$('result').hidden) tickCountdown(); }, 1000);

  // ---------- dialogs ----------

  $('help-btn').addEventListener('click', () => $('help').showModal());
  $('stats-btn').addEventListener('click', openStats);
  $('result-stats-btn').addEventListener('click', openStats);
  for (const d of document.querySelectorAll('dialog')) {
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); }); // backdrop click
  }

  drawGrid($('example-grid'), 3, { path: [0, 4, 8, 7, 6], marks: PL.feedback([0, 4, 8, 7, 6], [0, 1, 4, 7, 8]), tone: 'fb' });

  // ---------- start ----------

  // ---------- archive ----------

  const formatDate = (d, opts) => new Date(PL.dateKey(d) + 'T12:00:00Z')
    .toLocaleDateString(undefined, { timeZone: 'UTC', ...opts });

  const dayUrl = (d) => (d === today ? location.pathname : `${location.pathname}?d=${PL.dateKey(d)}`);

  function dayStatus(d) {
    const s = load(stateKey(d), null);
    if (!s || !s.locks.some((l) => l.guesses.length)) return { cls: '', text: 'Not played' };
    const done = s.locks.filter((l) => l.status !== 'playing').length;
    if (done < s.locks.length) return { cls: 'partial', text: `In progress · ${done}/3 locks` };
    const won = s.locks.filter((l) => l.status === 'won').length;
    return { cls: won === 3 ? 'won' : 'partial', text: s.locks.map((l) => (l.status === 'won' ? `${l.guesses.length}/6` : 'X/6')).join('  ') };
  }

  function openArchive() {
    const list = $('archive-list');
    list.replaceChildren();
    for (let d = today; d > today - 1 - ARCHIVE_LIST_DAYS; d--) {
      const st = dayStatus(d);
      const a = document.createElement('a');
      a.href = dayUrl(d);
      a.className = `archive-day ${st.cls}${d === day ? ' current' : ''}`;
      a.innerHTML = `<span>${d === today ? 'Today' : formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' })}</span>`
        + `<span class="archive-status">${st.text}</span>`;
      list.appendChild(a);
    }
    const picker = $('archive-date');
    picker.max = PL.dateKey(today - 1);
    picker.value = isArchive ? PL.dateKey(day) : '';
    $('archive').showModal();
  }

  $('archive-date').addEventListener('change', (e) => {
    const d = PL.dayFromKey(e.target.value);
    if (d !== null && d < today) location.href = dayUrl(d);
  });
  $('archive-btn').addEventListener('click', openArchive);
  $('result-archive-btn').addEventListener('click', openArchive);
  $('archive-banner-today').href = dayUrl(today);
  $('result-today-btn').href = dayUrl(today);

  $('puzzle-no').textContent = day >= 0 ? `#${day + 1}` : '';
  if (isArchive) {
    $('archive-banner').hidden = false;
    $('archive-banner-date').textContent = formatDate(day, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.title = `Pattern Lock · ${PL.dateKey(day)}`;
  }
  render();
  if (!load(SEEN_KEY, false)) {
    save(SEEN_KEY, true);
    $('help').showModal();
  }
})();
