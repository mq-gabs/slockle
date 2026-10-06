import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * A small "?" button that explains a number. Opens on mouse hover, and on tap or keyboard for
 * touch screens. The bubble is fixed to the viewport and kept inside it, so narrow columns and
 * the dialog's scroll area don't clip it.
 */
export function InfoTip({ label, text }: { label: string; text: string }) {
  const { t } = useI18n();
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const show = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(240, window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
    const below = r.bottom < window.innerHeight * 0.6;
    setStyle(below ? { top: r.bottom + 6, left, width } : { bottom: window.innerHeight - r.top + 6, left, width });
  };
  const hide = () => setStyle(null);

  useEffect(() => {
    if (!style) return;
    const outside = (e: PointerEvent) => e.target !== btn.current && hide();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    window.addEventListener('pointerdown', outside);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', outside);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
      window.removeEventListener('keydown', key);
    };
  }, [style]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="info"
        aria-label={t('aria.info', label)}
        aria-describedby={style ? id : undefined}
        onClick={(e) => (style && (e.nativeEvent as PointerEvent).pointerType !== 'mouse' ? hide() : show())}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
        onBlur={hide}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 5.7a2 2 0 1 1 2.8 1.8c-.5.2-.8.7-.8 1.2v.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.6" r="0.85" fill="currentColor" />
        </svg>
      </button>
      {style && <span id={id} role="tooltip" className="info-tip" style={style}>{text}</span>}
    </>
  );
}
