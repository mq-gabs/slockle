import { feedback } from '@slockle/shared';
import { useI18n } from '../i18n/I18nProvider';
import type { StringKey } from '../i18n/strings';
import { Legend } from './Legend';
import { Modal } from './Modal';
import { PatternGrid } from './PatternGrid';

// The spec's worked example: answer 1→2→5→8→9, guess 1→5→9→8→7.
const EXAMPLE_GUESS = [0, 4, 8, 7, 6];
const EXAMPLE_MARKS = feedback(EXAMPLE_GUESS, [0, 1, 4, 7, 8]);

// One move of each line kind on a 3×3 grid.
const LINE_TYPES: [number[], StringKey][] = [
  [[3, 4], 'help.lineH'],
  [[1, 4], 'help.lineV'],
  [[0, 4], 'help.lineD'],
  [[0, 5], 'help.lineO'],
];

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t('help.title')}>
      <p dangerouslySetInnerHTML={{ __html: t('help.intro') }} />
      <ul>
        <li>{t('help.rule1')}</li>
        <li>{t('help.rule2')}</li>
        <li>{t('help.rule3')}</li>
        <li>{t('help.rule4')}</li>
      </ul>

      <h3>{t('help.exampleTitle')}</h3>
      <p>{t('help.example')}</p>
      <div className="example">
        <PatternGrid n={3} path={EXAMPLE_GUESS} marks={EXAMPLE_MARKS} tone="fb" className="small-grid" />
        <Legend keys={['help.exG', 'help.exY', 'help.exX']} column />
      </div>

      <h3>{t('help.linesTitle')}</h3>
      <p>{t('help.lines')}</p>
      <div className="line-types">
        {LINE_TYPES.map(([path, key]) => (
          <figure key={key}>
            <PatternGrid n={3} path={path} numbers={false} />
            <figcaption>{t(key)}</figcaption>
          </figure>
        ))}
      </div>

      <p className="fine">{t('help.fine')}</p>
      <button className="primary" onClick={onClose}>{t('help.play')}</button>
    </Modal>
  );
}
