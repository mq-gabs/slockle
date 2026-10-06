import { LOCKS, shareText, type Pattern } from '@pattern-lock/shared';
import { useEffect, useState } from 'react';
import type { DayState } from '../game/state';
import { useI18n } from '../i18n/I18nProvider';
import { PatternGrid } from './PatternGrid';
import { describe } from './PlayScreen';

interface ResultScreenProps {
  state: DayState;
  answers: Pattern[];
  isArchive: boolean;
  /** Today's result failed to reach the server. */
  notSaved: boolean;
  todayHref: string;
  onArchive: () => void;
  onStats: () => void;
  onToast: (text: string) => void;
}

export function ResultScreen({ state, answers, isArchive, notSaved, todayHref, onArchive, onStats, onToast }: ResultScreenProps) {
  const { t } = useI18n();
  const wins = state.locks.filter((l) => l.status === 'won').length;

  async function share() {
    const text = shareText(state.day, state.locks, answers);
    try {
      await navigator.clipboard.writeText(text);
      onToast(t('toast.copied'));
    } catch {
      onToast(t('toast.failed'));
    }
  }

  return (
    <main className="result">
      <h2 className="result-title">{wins === LOCKS.length ? t('result.allOpen') : t('result.some', wins)}</h2>
      <div className="result-locks">
        {LOCKS.map((c, i) => {
          const l = state.locks[i]!;
          return (
            <div key={i} className="result-lock">
              <PatternGrid n={c.n} path={answers[i]} tone="answer" label={t('aria.lockAnswer', i + 1, describe(t, answers[i]!))} />
              <p className={l.status === 'won' ? undefined : 'lost'}>
                {l.status === 'won' ? `${l.guesses.length}/6` : 'X/6'}
              </p>
            </div>
          );
        })}
      </div>
      <button className="primary" onClick={share}>{t('result.share')}</button>
      {isArchive
        ? <p className="fine">{t('result.archiveNote')}</p>
        : <p className="countdown">{t('result.next')} <strong><Countdown /></strong></p>}
      {notSaved && <p className="fine">{t('result.notSaved')}</p>}
      <div className="result-actions">
        <button className="secondary" onClick={onArchive}>{t('result.archive')}</button>
        <button className="secondary" onClick={onStats}>{t('result.stats')}</button>
      </div>
      {isArchive && <p><a className="today-link" href={todayHref}>{t('result.today')}</a></p>}
    </main>
  );
}

/** Time left until local midnight; reloads into the new puzzle when it hits zero. */
function Countdown() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const s = Math.floor((midnight.getTime() - now.getTime()) / 1000);
  useEffect(() => {
    if (s <= 0) location.reload();
  }, [s]);
  const pad = (v: number) => String(v).padStart(2, '0');
  return <>{`${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`}</>;
}
