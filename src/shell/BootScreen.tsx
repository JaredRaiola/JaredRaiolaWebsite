import { useEffect, useState } from 'react';

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setHide(true);
      setTimeout(onDone, 300);
    }, 600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      onClick={() => {
        setHide(true);
        setTimeout(onDone, 200);
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: hide ? 0 : 1,
        transition: 'opacity 0.3s',
        zIndex: 99999,
        fontFamily: 'serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 'bold' }}>Windows 95</div>
        <div style={{ marginTop: 12, fontSize: 14, opacity: 0.6 }}>Starting up…</div>
      </div>
    </div>
  );
}
