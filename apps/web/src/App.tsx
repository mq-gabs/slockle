import { LOCKS, dateKey, dayFromKey, dayNumber } from '@pattern-lock/shared';
import { useEffect, useRef, useState } from 'react';
import { submitResult } from './api/client';
import { ArchiveDialog, formatDate } from './components/ArchiveDialog';
import { Header } from './components/Header';
import { HelpDialog } from './components/HelpDialog';
import { LockTabs } from './components/LockTabs';
import { PlayScreen } from './components/PlayScreen';
import { ResultScreen } from './components/ResultScreen';
import { StatsDialog } from './components/StatsDialog';
import { loadState } from './game/state';
import { SEEN_HELP_KEY, playerId, storage } from './game/storage';
import { useDayGame } from './game/useDayGame';
import { useI18n } from './i18n/I18nProvider';

// The day is fixed for the page's lifetime: ?d=YYYY-MM-DD plays a past day, anything else
// (including a future date) plays today's. Changing day is a page navigation.
const today = dayNumber(new Date());
const requested = dayFromKey(new URLSearchParams(location.search).get('d') ?? '');
const day = requested !== null && requested < today ? requested : today;
const isArchive = day !== today;
const dayHref = (d: number) => (d === today ? location.pathname : `${location.pathname}?d=${dateKey(d)}`);
const player = playerId();

type Dialog = 'help' | 'stats' | 'archive' | null;

export function App() {
  const { t, locale } = useI18n();
  const game = useDayGame(day);
  const { state } = game;
  const done = state.current >= LOCKS.length;

  const [dialog, setDialog] = useState<Dialog>(() => (storage.get(SEEN_HELP_KEY, false) ? null : 'help'));
  const [toast, setToast] = useState<string | null>(null);
  const [notSaved, setNotSaved] = useState(false);
  const [statsVersion, setStatsVersion] = useState(0);
  const statsAfterSubmit = useRef(false);

  useEffect(() => storage.set(SEEN_HELP_KEY, true), []);

  useEffect(() => {
    document.title = isArchive ? `Pattern Lock · ${dateKey(day)}` : t('doc.title');
  }, [t]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Send today's finished game. Past days never count; a failed send is retried on the next visit.
  useEffect(() => {
    if (isArchive || !done || state.submitted) return;
    let cancelled = false;
    const settle = (saved: boolean) => {
      if (cancelled) return;
      setNotSaved(!saved);
      if (saved) {
        game.markSubmitted();
        setStatsVersion((v) => v + 1);
      }
      if (statsAfterSubmit.current) {
        statsAfterSubmit.current = false;
        setDialog('stats');
      }
    };
    submitResult(dateKey(day), { playerId: player, locks: state.locks.map((l) => ({ guesses: l.guesses })) })
      .then(() => settle(true), () => settle(false));
    return () => {
      cancelled = true;
    };
  }, [done, state.submitted, state.locks, game.markSubmitted]);

  function next() {
    if (state.current === LOCKS.length - 1 && !isArchive) statsAfterSubmit.current = true;
    game.nextLock();
  }

  const answers = LOCKS.map((_, i) => game.answer(i));
  const allAnswers = answers.every(Boolean) ? answers.map((a) => a!) : null;

  return (
    <>
      <Header
        day={day}
        onHelp={() => setDialog('help')}
        onArchive={() => setDialog('archive')}
        onStats={() => setDialog('stats')}
      />

      {isArchive && (
        <div className="archive-banner">
          <span>
            {t('banner.past')} · <strong>{formatDate(locale, day, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </span>
          <a href={dayHref(today)}>{t('banner.today')}</a>
        </div>
      )}

      <LockTabs locks={state.locks} current={state.current} />

      {!done && (
        <PlayScreen
          key={state.current}
          lockIndex={state.current}
          lock={state.locks[state.current]!}
          answer={answers[state.current] ?? null}
          preparing={game.preparing}
          onGuess={game.guess}
          onNext={next}
        />
      )}
      {done && !allAnswers && <p className="msg">{t('play.preparing')}</p>}
      {done && allAnswers && (
        <ResultScreen
          state={state}
          answers={allAnswers}
          isArchive={isArchive}
          notSaved={notSaved}
          todayHref={dayHref(today)}
          onArchive={() => setDialog('archive')}
          onStats={() => setDialog('stats')}
          onToast={setToast}
        />
      )}

      <HelpDialog open={dialog === 'help'} onClose={() => setDialog(null)} />
      <StatsDialog
        open={dialog === 'stats'}
        onClose={() => setDialog(null)}
        playerId={player}
        today={today}
        todayState={isArchive ? loadState(today) : state}
        version={statsVersion}
      />
      <ArchiveDialog open={dialog === 'archive'} onClose={() => setDialog(null)} today={today} day={day} dayHref={dayHref} />

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
