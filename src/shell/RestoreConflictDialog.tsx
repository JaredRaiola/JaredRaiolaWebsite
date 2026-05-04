import { useEffect, useRef, useState } from 'react';
import {
  _setRestoreConflictSubscriber,
  type RestoreConflictResolution,
  type RestoreConflictResult,
} from '@/lib/restoreConflict';
import './RestoreConflictDialog.css';

type Pending = {
  binName: string;
  originPath: string;
  multi: boolean;
  resolve: (r: RestoreConflictResult) => void;
};

export function RestoreConflictDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [applyToAll, setApplyToAll] = useState(false);
  const replaceBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    _setRestoreConflictSubscriber((args, resolve) => {
      setApplyToAll(false);
      setPending({ ...args, resolve });
    });
    return () => _setRestoreConflictSubscriber(null);
  }, []);

  useEffect(() => {
    if (pending) replaceBtnRef.current?.focus();
  }, [pending]);

  if (!pending) return null;

  const finish = (resolution: RestoreConflictResolution): void => {
    pending.resolve({ resolution, applyToAll });
    setPending(null);
  };

  return (
    <div
      className="rcd-overlay"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          finish('cancel');
        }
      }}
    >
      <div className="rcd-dialog" role="dialog" aria-modal="true">
        <div className="rcd-titlebar">
          <span className="rcd-title">Confirm File Replace</span>
          <button className="rcd-x" onClick={() => finish('cancel')} aria-label="Close">
            ×
          </button>
        </div>
        <div className="rcd-body">
          <img className="rcd-icon" src="/assets/win98/png/msg_warning-0.png" alt="" />
          <div className="rcd-content">
            <p className="rcd-message">
              An item named &lsquo;{pending.binName}&rsquo; already exists at &lsquo;
              {pending.originPath}&rsquo;. Would you like to replace it, restore with a new name,
              or cancel?
            </p>
            {pending.multi && (
              <label className="rcd-applyall">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                />{' '}
                Apply this choice to all remaining conflicts
              </label>
            )}
          </div>
        </div>
        <div className="rcd-buttons">
          <button ref={replaceBtnRef} onClick={() => finish('replace')}>
            Replace
          </button>
          <button onClick={() => finish('rename')}>Rename</button>
          <button onClick={() => finish('cancel')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
