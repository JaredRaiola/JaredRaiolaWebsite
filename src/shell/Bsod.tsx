import { useEffect } from 'react';
import { useBsodStore } from '@/stores/bsodStore';
import './Bsod.css';

export function Bsod() {
  const active = useBsodStore((s) => s.active);
  const dismiss = useBsodStore((s) => s.dismiss);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent): void => { e.preventDefault(); dismiss(); };
    const onClick = (): void => dismiss();
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('mousedown', onClick, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('mousedown', onClick, true);
    };
  }, [active, dismiss]);

  if (!active) return null;

  return (
    <div className="bsod-root">
      <div className="bsod-content">
        <div className="bsod-header"><span>Windows</span></div>
        <div className="bsod-body">
{`A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) +
00010E36.  The current application will be terminated.

*  Press any key to terminate the current application.
*  Press CTRL+ALT+DEL again to restart your computer. You will
   lose any unsaved information in all applications.`}
        </div>
        <div className="bsod-footer">Press any key to continue _</div>
      </div>
    </div>
  );
}
