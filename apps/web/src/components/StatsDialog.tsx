import { FAILED_BUCKET, dateKey, type DayStatsDto, type PlayerStatsDto } from '@slockle/shared';
import { useEffect, useState } from 'react';
import { getDayStats, getPlayerStats } from '../api/client';
import type { DayState } from '../game/state';
import { useI18n } from '../i18n/I18nProvider';
import { Modal } from './Modal';

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  playerId: string;
  today: number;
  /** Today's game, to highlight its buckets once it has been submitted. */
  todayState: DayState | null;
  /** Changes when a new result is stored, so the numbers refresh. */
  version: number;
}

type Loaded = { player: PlayerStatsDto; day: DayStatsDto };

export function StatsDialog({ open, onClose, playerId, today, todayState, version }: StatsDialogProps) {
  const { t } = useI18n();
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);
    const date = dateKey(today);
    Promise.all([getPlayerStats(playerId, date), getDayStats(date)])
      .then(([player, day]) => !cancelled && setData({ player, day }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [open, playerId, today, version]);

  const p = data?.player;
  const highlight = todayState?.submitted
    ? todayState.locks.map((l) => (l.status === 'won' ? l.guesses.length - 1 : FAILED_BUCKET))
    : [];

  return (
    <Modal open={open} onClose={onClose} title={t('stats.title')}>
      {failed && !p && <p className="fine">{t('stats.error')}</p>}
      {!failed && !p && <p className="fine">{t('stats.loading')}</p>}
      {p && (
        <>
          <div className="stat-row">
            {([
              [p.played, 'stats.played'],
              [p.played ? Math.round((p.won / p.played) * 100) : 0, 'stats.winRate'],
              [p.currentStreak, 'stats.streak'],
              [p.bestStreak, 'stats.best'],
            ] as const).map(([v, key]) => (
              <div key={key}><strong>{v}</strong><span>{t(key)}</span></div>
            ))}
          </div>
          <h3>{t('stats.dist')}</h3>
          <div className="dist">
            {p.distribution.map((v, k) => (
              <div key={k} className="dist-row">
                <span>{k === FAILED_BUCKET ? 'X' : k + 1}</span>
                <div
                  className={`dist-bar${highlight.includes(k) ? ' hl' : ''}`}
                  style={{ width: `${Math.max(8, (v / Math.max(1, ...p.distribution)) * 100)}%` }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          {data.day.players > 0 && <p className="fine">{t('stats.today', data.day.players, data.day.allOpened)}</p>}
        </>
      )}
    </Modal>
  );
}
