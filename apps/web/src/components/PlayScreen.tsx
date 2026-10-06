import { LOCKS, MAX_ATTEMPTS, Mark, feedback, type Pattern } from '@slockle/shared';
import { useEffect, useState } from 'react';
import type { LockState } from '../game/state';
import type { GuessOutcome } from '../game/useDayGame';
import { useI18n, type I18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { DrawingBoard } from './DrawingBoard';
import { Legend } from './Legend';
import { PatternGrid } from './PatternGrid';

interface PlayScreenProps {
  lockIndex: number;
  lock: LockState;
  answer: Pattern | null;
  preparing: boolean;
  onGuess: (path: Pattern) => GuessOutcome;
  onNext: () => void;
}

/** Message kept as a key so it re-translates when the language changes. */
type Message = { key: StringKey; args?: unknown[] } | null;

export function describe(t: I18n['t'], path: Pattern, marks?: Mark[]): string {
  const words: Record<Mark, string> = { [Mark.Green]: t('mark.g'), [Mark.Yellow]: t('mark.y'), [Mark.Gray]: t('mark.x') };
  return path.map((d, i) => `${d + 1}${marks ? ` (${words[marks[i]!]})` : ''}`).join(', ');
}

export function PlayScreen({ lockIndex, lock, answer, preparing, onGuess, onNext }: PlayScreenProps) {
  const { t, hintText } = useI18n();
  const { n, len } = LOCKS[lockIndex]!;
  const [message, setMessage] = useState<Message>(null);
  const [shake, setShake] = useState(0);
  const [newestHint, setNewestHint] = useState(-1);

  useEffect(() => setMessage(null), [lockIndex]);

  function handleDraw(path: Pattern) {
    setMessage(null);
    const outcome = onGuess(path);
    switch (outcome.kind) {
      case 'wrong-length':
        setMessage({ key: 'play.wrongLength', args: [outcome.len, outcome.got] });
        setShake((s) => s + 1);
        break;
      case 'repeat':
        setMessage({ key: 'play.repeat' });
        setShake((s) => s + 1);
        break;
      case 'won':
        setMessage(outcome.attempts === 1 ? { key: 'play.firstTry' } : { key: 'play.unlocked', args: [outcome.attempts] });
        break;
      case 'lost':
        setMessage({ key: 'play.lost' });
        break;
      case 'miss':
        setNewestHint(lock.hints.length);
        break;
    }
  }

  // Main grid: revealed answer, else the last guess's colours, else empty.
  const last = lock.guesses[lock.guesses.length - 1];
  let shown: { path: Pattern; marks?: Mark[]; tone: 'draw' | 'fb' | 'answer' } = { path: [], tone: 'draw' };
  let label = t('aria.empty', n, len);
  if (answer && lock.status !== 'playing') {
    shown = { path: answer, tone: 'answer' };
    label = t('aria.answer', describe(t, answer));
  } else if (answer && last) {
    const marks = feedback(last, answer);
    shown = { path: last, marks, tone: 'fb' };
    label = t('aria.lastGuess', describe(t, last, marks));
  }

  const left = MAX_ATTEMPTS - lock.guesses.length;
  // Show "no new hint" once, however many slots ran out.
  const hints = lock.hints.filter((h, k) => !(h.k === 'none' && lock.hints[k - 1]?.k === 'none'));

  return (
    <main>
      <div className="status">
        <span dangerouslySetInnerHTML={{ __html: t('play.lockInfo', lockIndex + 1, len) }} />
        {lock.status === 'playing' && <span dangerouslySetInnerHTML={{ __html: t('play.attempts', left) }} />}
      </div>

      <div className="board">
        <DrawingBoard
          n={n}
          enabled={Boolean(answer) && lock.status === 'playing'}
          shown={shown}
          label={label}
          shake={shake}
          onDraw={handleDraw}
        />
        <div className="thumbs" aria-label={t('aria.thumbs')}>
          {answer && lock.guesses.map((g, k) => {
            const marks = feedback(g, answer);
            return (
              <PatternGrid
                key={k}
                n={n}
                path={g}
                marks={marks}
                tone="fb"
                numbers={false}
                arrows
                compact
                label={t('aria.guess', k + 1, describe(t, g, marks))}
              />
            );
          })}
        </div>
      </div>

      <Legend />

      <p className="msg" aria-live="polite">
        {preparing ? t('play.preparing') : message ? t(message.key, ...(message.args ?? [])) : ''}
      </p>

      {lock.status !== 'playing' && (
        <div className="lock-end">
          <button className="primary" onClick={onNext}>
            {t(lockIndex < LOCKS.length - 1 ? 'play.next' : 'play.results')}
          </button>
        </div>
      )}

      <section className="hints">
        <h2>{t('play.hints')}</h2>
        <ol>
          {hints.map((h, k) => (
            <li key={k} className={k === newestHint ? 'new' : undefined}>
              {h.k === 'none' ? t('play.noHint') : hintText(h, n)}
            </li>
          ))}
          {lock.status === 'playing' && lock.guesses.length < MAX_ATTEMPTS - 1 && (
            <li className="locked">{t('play.moreHints')}</li>
          )}
        </ol>
      </section>
    </main>
  );
}
