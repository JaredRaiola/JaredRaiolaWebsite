import { useEffect, useRef, useState } from 'react';
import './Flyout.css';

export type FlyoutItem =
  | { kind: 'action'; label: string; icon?: string; onSelect(): void; disabled?: boolean }
  | { kind: 'submenu'; label: string; icon?: string; items: FlyoutItem[]; disabled?: boolean }
  | { kind: 'separator' };

type Props = {
  items: FlyoutItem[];
  /** className applied to the outer container; lets the root menu use a different class. */
  className?: string;
};

const HOVER_OPEN_DELAY = 150;

export function Flyout({ items, className = 'flyout' }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const cancelOpenTimer = (): void => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  useEffect(() => () => cancelOpenTimer(), []);

  const handleEnter = (idx: number, item: FlyoutItem): void => {
    cancelOpenTimer();
    if (item.kind === 'submenu' && !item.disabled) {
      openTimerRef.current = window.setTimeout(() => {
        setOpenIndex(idx);
      }, HOVER_OPEN_DELAY);
    } else {
      // Hovering a non-submenu sibling: close any pending submenu.
      setOpenIndex(null);
    }
  };

  const handleLeave = (): void => {
    cancelOpenTimer();
  };

  return (
    <div className={className}>
      {items.map((item, idx) => {
        if (item.kind === 'separator') {
          return <div key={idx} className="flyout-sep" />;
        }
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className={`flyout-item${item.disabled ? ' disabled' : ''}${isOpen ? ' active' : ''}`}
            onMouseEnter={() => handleEnter(idx, item)}
            onMouseLeave={handleLeave}
            onClick={(e) => {
              e.stopPropagation();
              if (item.disabled) return;
              if (item.kind === 'action') item.onSelect();
              if (item.kind === 'submenu') setOpenIndex(isOpen ? null : idx);
            }}
          >
            {item.icon && <img src={item.icon} alt="" />}
            <span className="flyout-label">{item.label}</span>
            {item.kind === 'submenu' && <span className="flyout-arrow">▶</span>}
            {item.kind === 'submenu' && isOpen && (
              <div className="flyout-submenu">
                <Flyout items={item.items} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
