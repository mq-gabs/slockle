import type { StringKey } from '../i18n/strings';
import { useI18n } from '../i18n/I18nProvider';

/** Colour key; `keys` lets How to play reuse it with its own example captions. */
export function Legend({
  keys = ['legend.g', 'legend.y', 'legend.x'],
  column = false,
}: { keys?: [StringKey, StringKey, StringKey]; column?: boolean }) {
  const { t } = useI18n();
  return (
    <ul className={`legend${column ? ' legend-col' : ''}`} aria-label={t('aria.legend')}>
      <li><span className="key key-g" />{t(keys[0])}</li>
      <li><span className="key key-y" />{t(keys[1])}</li>
      <li><span className="key key-x" />{t(keys[2])}</li>
    </ul>
  );
}
