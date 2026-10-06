import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** A native <dialog> shown modally: Escape, the × button and a backdrop click all close it. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-label={title}
    >
      <button className="close" aria-label={t('aria.close')} onClick={onClose}>×</button>
      <h2>{title}</h2>
      {open && children}
    </dialog>
  );
}
