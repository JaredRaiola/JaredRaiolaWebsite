import { useEffect, useRef } from 'react';
import type { AppProps } from '@/core/apps/registry';
import './resume.css';

type ResumeSnapshot = { scrollY: number };

export default function Resume({ api, restoreState }: AppProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const restored = (restoreState as Partial<ResumeSnapshot> | undefined);

  const print = (): void => {
    frameRef.current?.contentWindow?.print();
  };

  // Restore scroll position once the iframe loads.
  useEffect(() => {
    if (!restored || typeof restored.scrollY !== 'number') return;
    const f = frameRef.current;
    if (!f) return;
    const apply = (): void => {
      f.contentWindow?.scrollTo(0, restored.scrollY!);
    };
    if (f.contentDocument && f.contentDocument.readyState === 'complete') apply();
    else f.addEventListener('load', apply, { once: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register snapshot — read scrollY at save time.
  useEffect(() => {
    return api.registerSnapshot((): ResumeSnapshot => ({
      scrollY: frameRef.current?.contentWindow?.scrollY ?? 0,
    }));
  }, [api]);

  return (
    <div className="resume-root">
      <div className="resume-toolbar">
        <button onClick={print}>Print…</button>
      </div>
      <iframe
        ref={frameRef}
        id="resume-frame"
        className="resume-frame"
        src="/resume/index.html"
        title="Resume"
      />
    </div>
  );
}
