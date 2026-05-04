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
      return (
        <div style={{ padding: 20, fontFamily: 'monospace', color: '#fff', background: '#008080', height: '100vh', overflow: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Render error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.4)', padding: 12 }}>
            {this.state.error.stack || String(this.state.error)}
          </pre>
          <button onClick={() => this.setState({ error: null })}>Try again</button>
          <button onClick={() => location.reload()} style={{ marginLeft: 8 }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<Error | null>(null);
  const [bootDone, setBootDone] = useState(false);
  const { isMobile } = useResponsive();

  useEffect(() => {
    void boot()
      .then(() => setReady(true))
      .catch((e: Error) => setBootError(e));
  }, []);

  if (isMobile) return <MobileFallback />;
  if (bootError) {
    return (
      <div style={{ padding: 20, fontFamily: 'monospace', color: '#fff', background: '#008080', height: '100vh', overflow: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Boot error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.4)', padding: 12 }}>
          {bootError.stack || String(bootError)}
        </pre>
        <button onClick={() => location.reload()}>Reload</button>
      </div>
    );
  }
  if (!bootDone) return <BootScreen onDone={() => setBootDone(true)} />;
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
