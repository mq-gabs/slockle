import { LOCKS } from '@pattern-lock/shared';
import type { LockState } from '../game/state';
import { useI18n } from '../i18n/I18nProvider';

export function LockTabs({ locks, current }: { locks: LockState[]; current: number }) {
  const { t } = useI18n();
  return (
    <nav className="locks" aria-label={t('aria.locks')}>
      {LOCKS.map((c, i) => {
        const l = locks[i]!;
        const detail = l.status === 'won' ? `${l.guesses.length}/6` : l.status === 'lost' ? 'X/6' : `${c.n}×${c.n}`;
        const cls = ['lock-pill', l.status !== 'playing' && l.status, i === current && 'current'].filter(Boolean).join(' ');
        return (
          <div key={i} className={cls}>
            <span>{t('tab.lock', i + 1)}</span>
            <small>{detail}</small>
          </div>
        );
      })}
    </nav>
  );
}
