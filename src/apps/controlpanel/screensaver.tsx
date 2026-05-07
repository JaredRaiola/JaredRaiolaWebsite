import { useState } from 'react';
import { useScreensaverStore, type ScreensaverKind } from '@/stores/screensaverStore';

const KIND_OPTIONS: Array<{ value: ScreensaverKind; label: string }> = [
  { value: 'none', label: '(None)' },
  { value: 'mystify', label: 'Mystify Your Mind' },
  { value: 'pipes', label: '3D Pipes' },
];

const WAIT_OPTIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 1, label: '1 minute' },
  { minutes: 2, label: '2 minutes' },
  { minutes: 5, label: '5 minutes' },
  { minutes: 10, label: '10 minutes' },
  { minutes: 15, label: '15 minutes' },
  { minutes: 30, label: '30 minutes' },
];

type Props = {
  onClose(): void;
};

export function ScreensaverTab({ onClose }: Props) {
  const kind = useScreensaverStore((s) => s.kind);
  const timeoutMs = useScreensaverStore((s) => s.timeoutMs);
  const setKind = useScreensaverStore((s) => s.setKind);
  const setTimeoutMs = useScreensaverStore((s) => s.setTimeoutMs);
  const setActive = useScreensaverStore((s) => s.setActive);

  const [draftKind, setDraftKind] = useState<ScreensaverKind>(kind);
  const [draftMinutes, setDraftMinutes] = useState<number>(Math.round(timeoutMs / 60000));

  const apply = (): void => {
    setKind(draftKind);
    setTimeoutMs(draftMinutes * 60_000);
  };

  const okAndClose = (): void => { apply(); onClose(); };

  return (
    <div className="cp-display">
      <div className="cp-section">
        <label className="cp-label">Screen Saver</label>
        <select
          value={draftKind}
          onChange={(e) => setDraftKind(e.target.value as ScreensaverKind)}
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="cp-row" style={{ gap: 6 }}>
          <button
            disabled={draftKind === 'none'}
            onClick={() => {
              // Apply temporarily so the active saver matches the draft, then
              // trigger it. The preview dismisses on any input as usual.
              setKind(draftKind);
              setActive(true);
            }}
          >Preview</button>
        </div>
      </div>

      <div className="cp-section">
        <label className="cp-label">Wait</label>
        <select
          value={draftMinutes}
          onChange={(e) => setDraftMinutes(Number(e.target.value))}
        >
          {WAIT_OPTIONS.map((o) => (
            <option key={o.minutes} value={o.minutes}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="cp-buttons">
        <button onClick={okAndClose}>OK</button>
        <button onClick={onClose}>Cancel</button>
        <button onClick={apply}>Apply</button>
      </div>
    </div>
  );
}
