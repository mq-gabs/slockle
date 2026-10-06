import { puzzleNumber } from '@slockle/shared';
import { useI18n } from '../i18n/I18nProvider';
import { LANGS, type Lang } from '../i18n/strings';

interface HeaderProps {
  day: number;
  onHelp: () => void;
  onArchive: () => void;
  onStats: () => void;
}

export function Header({ day, onHelp, onArchive, onStats }: HeaderProps) {
  const { t, lang, setLang } = useI18n();
  const num = puzzleNumber(day);
  return (
    <header className="top">
      <div className="top-actions">
        <button className="icon-btn" aria-label={t('aria.help')} onClick={onHelp}>?</button>
        <select
          className="lang-select"
          aria-label={t('aria.lang')}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
        >
          {Object.entries(LANGS).map(([code, info]) => (
            <option key={code} value={code} title={info.name}>{info.label}</option>
          ))}
        </select>
      </div>
      <h1>
        <img className="logo" src="/logo.svg" alt="" width="28" height="28" />
        Slockle {num !== null && <span>#{num}</span>}
      </h1>
      <div className="top-actions">
        <button className="icon-btn" aria-label={t('aria.archive')} onClick={onArchive}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M4 10h16M9 3v4M15 3v4" />
          </svg>
        </button>
        <button className="icon-btn" aria-label={t('aria.stats')} onClick={onStats}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11M12 20V4M19 20v-6" /></svg>
        </button>
      </div>
    </header>
  );
}
