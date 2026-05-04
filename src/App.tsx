import { useEffect, useState } from 'react';
import { boot } from '@/core/boot';
import { useResponsive } from '@/lib/useResponsive';
import { Shell } from '@/shell/Shell';
import { BootScreen } from '@/shell/BootScreen';
import { MobileFallback } from '@/shell/MobileFallback';

export default function App() {
  const [ready, setReady] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const { isMobile } = useResponsive();

  useEffect(() => {
    void boot().then(() => setReady(true));
  }, []);

  if (isMobile) return <MobileFallback />;
  if (!bootDone) return <BootScreen onDone={() => setBootDone(true)} />;
  if (!ready) return <div style={{ padding: 20 }}>Loading…</div>;
  return <Shell />;
}
