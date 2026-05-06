import type { AppProps } from '@/core/apps/registry';
import './resume.css';

export default function Resume(_props: AppProps) {
  const print = (): void => {
    const iframe = document.getElementById('resume-frame') as HTMLIFrameElement | null;
    iframe?.contentWindow?.print();
  };
  return (
    <div className="resume-root">
      <div className="resume-toolbar">
        <button onClick={print}>Print…</button>
      </div>
      <iframe
        id="resume-frame"
        className="resume-frame"
        src="/resume/index.html"
        title="Resume"
      />
    </div>
  );
}
