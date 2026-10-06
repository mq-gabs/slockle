import { LOCKS, dateKey, dayFromKey } from '@pattern-lock/shared';
import { useMemo } from 'react';
import { loadState } from '../game/state';
import { useI18n, type I18n } from '../i18n/I18nProvider';
import { Modal } from './Modal';

const LIST_DAYS = 30;

interface ArchiveDialogProps {
  open: boolean;
  onClose: () => void;
  today: number;
  day: number;
  dayHref: (day: number) => string;
}

export const formatDate = (locale: string, day: number, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${dateKey(day)}T12:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC', ...opts });

function dayStatus(t: I18n['t'], d: number): { cls: string; text: string } {
  const s = loadState(d);
  if (!s.locks.some((l) => l.guesses.length)) return { cls: '', text: t('archive.notPlayed') };
  const done = s.locks.filter((l) => l.status !== 'playing').length;
  if (done < LOCKS.length) return { cls: 'partial', text: t('archive.inProgress', done) };
  const won = s.locks.filter((l) => l.status === 'won').length;
  return {
    cls: won === LOCKS.length ? 'won' : 'partial',
    text: s.locks.map((l) => (l.status === 'won' ? `${l.guesses.length}/6` : 'X/6')).join('  '),
  };
}

/** Last 30 days with their saved status, plus a date picker for anything older. */
export function ArchiveDialog({ open, onClose, today, day, dayHref }: ArchiveDialogProps) {
  const { t, locale } = useI18n();
  const rows = useMemo(
    () => (open ? Array.from({ length: LIST_DAYS + 1 }, (_, k) => today - k) : []),
    [open, today],
  );

  return (
    <Modal open={open} onClose={onClose} title={t('archive.title')}>
      <p className="fine">{t('archive.note')}</p>
      <label className="archive-pick">
        <span>{t('archive.pick')}</span>
        <input
          type="date"
          max={dateKey(today - 1)}
          defaultValue={day !== today ? dateKey(day) : ''}
          onChange={(e) => {
            const d = dayFromKey(e.target.value);
            if (d !== null && d < today) location.href = dayHref(d);
          }}
        />
      </label>
      <div className="archive-list">
        {rows.map((d) => {
          const st = dayStatus(t, d);
          return (
            <a key={d} href={dayHref(d)} className={`archive-day ${st.cls}${d === day ? ' current' : ''}`}>
              <span>{d === today ? t('archive.today') : formatDate(locale, d, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span className="archive-status">{st.text}</span>
            </a>
          );
        })}
      </div>
    </Modal>
  );
}
