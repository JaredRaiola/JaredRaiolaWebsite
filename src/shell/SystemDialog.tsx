import { useEffect, useRef, useState } from 'react';
import { useDialogStore, type DialogConfig, type DialogIcon } from '@/stores/dialogStore';
import './SystemDialog.css';

const ICON_URL: Record<DialogIcon, string> = {
  info: '/assets/win98/png/msg_information-0.png',
  error: '/assets/win98/png/msg_error-0.png',
  warn: '/assets/win98/png/msg_warning-0.png',
  question: '/assets/win98/png/msg_question-0.png',
};

export function SystemDialogHost() {
  const queue = useDialogStore((s) => s.queue);

  // Preload dialog icons so they don't flash in on first dialog show.
  useEffect(() => {
    for (const url of Object.values(ICON_URL)) {
      const img = new Image();
      img.src = url;
    }
  }, []);

  // Only render the head of the queue; rest stack behind sequentially.
  const top = queue[0];
  if (!top) return null;
  return <SystemDialog key={top.id} config={top} />;
}

function SystemDialog({ config }: { config: DialogConfig }) {
  const resolve = useDialogStore((s) => s.resolve);
  const [value, setValue] = useState<string>(config.defaultValue ?? '');
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const okBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const onTitlebarPointerDown = (e: React.PointerEvent): void => {
    // Don't start a drag from the close button.
    if ((e.target as HTMLElement).closest('.sysdialog-x')) return;
    e.preventDefault();
    const el = dialogRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Lock current viewport position so subsequent moves are absolute, not
    // relative to the centered flex layout.
    setPos({ x: rect.left, y: rect.top });
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const onMove = (mv: PointerEvent) => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const nx = Math.max(0, Math.min(window.innerWidth - w, mv.clientX - offsetX));
      const ny = Math.max(0, Math.min(window.innerHeight - h, mv.clientY - offsetY));
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Focus input on prompts, OK button otherwise. Select the default text so
  // the user can replace it instantly (Win95 behavior for rename dialogs).
  useEffect(() => {
    if (config.kind === 'prompt') {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      okBtnRef.current?.focus();
    }
  }, [config.kind]);

  const onOk = (): void => {
    if (config.kind === 'prompt') resolve(config.id, value);
    else resolve(config.id, true);
  };
  const onCancel = (): void => {
    if (config.kind === 'prompt') resolve(config.id, null);
    else resolve(config.id, false);
  };
  // For an alert (no cancel), Esc and the close X both confirm — there's
  // nothing to cancel, just dismiss.
  const onClose = (): void => {
    if (config.kind === 'alert') resolve(config.id, true);
    else onCancel();
  };

  const onKey = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOk();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // When the user has dragged the dialog, pin it absolutely; otherwise let
  // the overlay's flex layout center it.
  const dialogStyle: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, margin: 0 }
    : {};

  return (
    <div className="sysdialog-overlay" onKeyDown={onKey}>
      <div
        ref={dialogRef}
        className="sysdialog"
        style={dialogStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`sysdialog-title-${config.id}`}
      >
        <div className="sysdialog-titlebar" onPointerDown={onTitlebarPointerDown}>
          <span id={`sysdialog-title-${config.id}`} className="sysdialog-title">
            {config.title}
          </span>
          <button className="sysdialog-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sysdialog-body">
          <img className="sysdialog-icon" src={ICON_URL[config.icon]} alt="" />
          <div className="sysdialog-content">
            <p className="sysdialog-message">{config.message}</p>
            {config.kind === 'prompt' && (
              <input
                ref={inputRef}
                className="sysdialog-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="sysdialog-buttons">
          <button ref={okBtnRef} onClick={onOk}>{config.okLabel}</button>
          {config.cancelLabel && <button onClick={onCancel}>{config.cancelLabel}</button>}
        </div>
      </div>
    </div>
  );
}
