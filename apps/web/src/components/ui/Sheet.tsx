import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Occupa tutta l'altezza: utile per la ricerca esercizi. */
  full?: boolean;
}

/**
 * Foglio modale costruito sull'elemento dialog nativo.
 * showModal fornisce gratuitamente il confinamento del focus, la chiusura con
 * Escape, l'inertizzazione del resto della pagina e il layer superiore:
 * riprodurre queste cose a mano e' la fonte piu' comune di modali inaccessibili.
 */
export function Sheet({ open, onClose, title, children, full = false }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const scrollY = useRef(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      scrollY.current = window.scrollY;
      dialog.showModal();
      document.body.style.position = 'fixed';
      document.body.style.insetInline = '0';
      document.body.style.top = `-${scrollY.current}px`;
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => () => {
    document.body.style.position = '';
    document.body.style.insetInline = '';
    document.body.style.top = '';
  }, []);

  const handleClose = () => {
    document.body.style.position = '';
    document.body.style.insetInline = '';
    document.body.style.top = '';
    window.scrollTo(0, scrollY.current);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      className="sheet"
      data-full={full || undefined}
      onClose={handleClose}
      onCancel={(e) => { e.preventDefault(); handleClose(); }}
      onClick={(e) => { if (e.target === ref.current) handleClose(); }}
      aria-labelledby="sheet-title"
    >
      <div className="sheet__panel">
        <div className="sheet__head">
          <h2 id="sheet-title" className="section-title">{title}</h2>
          <IconButton label="Chiudi" onClick={handleClose}>
            <X size={22} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Conferma', destructive = false, onConfirm, onCancel,
}: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="confirm__panel">
        <h2 id="confirm-title" className="section-title">{title}</h2>
        <p id="confirm-message" className="muted" style={{ margin: 0 }}>{message}</p>
        <div className="row" style={{ gap: 'calc(var(--spacing) * 2)', marginBlockStart: 'calc(var(--spacing) * 4)' }}>
          <button type="button" className="btn btn--secondary btn--block" onClick={onCancel}>Annulla</button>
          <button
            type="button"
            className={`btn btn--block ${destructive ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
