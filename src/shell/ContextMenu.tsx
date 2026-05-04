import { useEffect, useRef } from 'react';
import { useContextMenuStore } from '@/stores/contextMenuStore';
import './ContextMenu.css';

export function ContextMenu() {
  const { open, x, y, items, close } = useContextMenuStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (!open) return null;
  return (
    <div ref={ref} className="ctx-menu" style={{ left: x, top: y }}>
      {items.map((item, i) => {
        if (item.kind === 'separator') return <div key={i} className="ctx-sep" />;
        if (item.kind === 'submenu') {
          return (
            <div key={i} className="ctx-item disabled" title="(submenu — Phase 2)">
              {item.label} ▶
            </div>
          );
        }
        return (
          <div
            key={i}
            className={`ctx-item ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (item.disabled) return;
              item.onSelect();
              close();
            }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
