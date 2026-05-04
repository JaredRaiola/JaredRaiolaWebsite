import { Component, useEffect, useState, type ReactNode } from 'react';
import { boot } from '@/core/boot';
import { useResponsive } from '@/lib/useResponsive';
import { Shell } from '@/shell/Shell';
import { BootScreen } from '@/shell/BootScreen';
import { MobileFallback } from '@/shell/MobileFallback';

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Root error:', error, info);
  }
  render() {
    if (this.state.error) {
      const errorText = this.state.error.stack || String(this.state.error);
      const copyError = () => {
        const fallback = () => {
          const ta = document.createElement('textarea');
          ta.value = errorText;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
          } finally {
            document.body.removeChild(ta);
          }
        };
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(errorText).catch(fallback);
        } else {
          fallback();
        }
      };
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', color: '#fff', background: '#008080', height: '100vh', overflow: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Render error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.4)', padding: 12 }}>
            {errorText}
          </pre>
          <button onClick={() => this.setState({ error: null })}>Try again</button>
          <button onClick={() => location.reload()} style={{ marginLeft: 8 }}>Reload</button>
          <button onClick={copyError} style={{ marginLeft: 8 }}>Copy error</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const BOOTED_KEY = 'win95.booted';

// Cold start = first time this tab session sees the page; reloads keep sessionStorage,
// so they skip the boot animation. The shutdown action clears this flag.
const shouldShowBoot = (): boolean => {
  try {
    return sessionStorage.getItem(BOOTED_KEY) !== '1';
  } catch {
    return true;
  }
};

function AppInner() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<Error | null>(null);
  const [showBoot] = useState<boolean>(() => shouldShowBoot());
  const [bootDone, setBootDone] = useState<boolean>(() => !shouldShowBoot());
  const { isMobile } = useResponsive();

  useEffect(() => {
    void boot()
      .then(() => {
        setReady(true);
        try {
          sessionStorage.setItem(BOOTED_KEY, '1');
        } catch {
          // ignore storage errors
        }
      })
      .catch((e: Error) => setBootError(e));
  }, []);

  if (isMobile) return <MobileFallback />;
  if (bootError) {
    const errorText = bootError.stack || String(bootError);
    const copyError = () => {
      const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = errorText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(ta);
        }
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(errorText).catch(fallback);
      } else {
        fallback();
      }
    };
    return (
      <div style={{ padding: 20, fontFamily: 'monospace', color: '#fff', background: '#008080', height: '100vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Boot error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.4)', padding: 12 }}>
          {errorText}
        </pre>
        <button onClick={() => location.reload()}>Reload</button>
        <button onClick={copyError} style={{ marginLeft: 8 }}>Copy error</button>
      </div>
    );
  }
  if (showBoot && !bootDone) return <BootScreen onDone={() => setBootDone(true)} />;
  if (!ready) return <div style={{ padding: 20 }}>Loading…</div>;
  return <Shell />;
}

export default function App() {
  return (
    <RootErrorBoundary>
      <AppInner />
    </RootErrorBoundary>
  );
}
