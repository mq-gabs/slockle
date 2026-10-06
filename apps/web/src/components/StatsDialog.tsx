import { FAILED_BUCKET, LOCKS, dateKey, type DayStatsDto, type PlayerStatsDto } from '@slockle/shared';
import { useEffect, useState, type CSSProperties } from 'react';
import { getDayStats, getPlayerStats } from '../api/client';
import type { DayState } from '../game/state';
import { useI18n } from '../i18n/I18nProvider';
import { InfoTip } from './InfoTip';
import { Modal } from './Modal';

interface StatsDialogProps {
  open: boolean;
  onClose: () => void;
  playerId: string;
  today: number;
  /** Today's game: its per-lock results, and its buckets are highlighted once submitted. */
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
          <section className="stats-section">
            <h3>{t('stats.you')}</h3>
            <div className="stat-row">
              <Stat value={p.played} label={t('stats.played')} info={t('info.played')} />
              <Stat value={p.played ? Math.round((p.won / p.played) * 100) : 0} label={t('stats.winRate')} info={t('info.winRate')} />
              <Stat value={p.currentStreak} label={t('stats.streak')} info={t('info.streak')} />
              <Stat value={p.bestStreak} label={t('stats.best')} info={t('info.best')} />
            </div>
            <div className="stat-row" style={{ '--cols': LOCKS.length } as CSSProperties}>
              {LOCKS.map((_, i) => {
                const l = todayState?.locks[i];
                const value = l?.status === 'won' ? `${l.guesses.length}/6` : l?.status === 'lost' ? 'X/6' : '–';
                return <Stat key={i} value={value} label={t('tab.lock', i + 1)} info={t('info.lock', i + 1)} />;
              })}
            </div>
          </section>

          <section className="stats-section">
            <h3>{t('stats.global')}</h3>
            <div className="stat-row" style={{ '--cols': 2 } as CSSProperties}>
              <Stat value={data.day.players} label={t('stats.players')} info={t('info.players')} />
              <Stat value={data.day.allOpened} label={t('stats.allOpened')} info={t('info.allOpened')} />
            </div>
            {data.day.players === 0 ? (
              <p className="fine">{t('stats.noPlayers')}</p>
            ) : (
              <div className="lock-dists">
                {data.day.locks.map((l, i) => (
                  <div key={i}>
                    <h4>{t('tab.lock', i + 1)}</h4>
                    <p className="fine">
                      {t('stats.opened', l.opened, data.day.players)}{' '}
                      <InfoTip label={t('stats.opened', l.opened, data.day.players)} text={t('info.lockOpened', i + 1)} />
                    </p>
                    <Distribution values={l.distribution} highlight={highlight[i] === undefined ? [] : [highlight[i]]} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Modal>
  );
}

function Stat({ value, label, info }: { value: number | string; label: string; info: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label} <InfoTip label={label} text={info} /></span>
    </div>
  );
}

function Distribution({ values, highlight }: { values: number[]; highlight: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="dist">
      {values.map((v, k) => (
        <div key={k} className="dist-row">
          <span>{k === FAILED_BUCKET ? 'X' : k + 1}</span>
          <div
            className={`dist-bar${highlight.includes(k) ? ' hl' : ''}`}
            style={{ width: `${Math.max(8, (v / max) * 100)}%` }}
          >
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}
