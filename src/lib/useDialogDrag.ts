import { useEffect, useRef, useState } from 'react';

/**
 * Drag a dialog by its title bar. The hook returns a `transform` string and a
 * pointer-down handler. Apply the transform to the dialog's outer element and
 * the handler to the title bar. The dialog's CSS positioning controls where it
 * starts; this hook only contributes a translate offset.
 */
export function useDialogDrag(): { transform: string; onPointerDown: (e: React.PointerEvent) => void } {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const startRef = useRef<{ pointerX: number; pointerY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent): void => {
      const s = startRef.current;
      if (!s) return;
      setPos({ x: s.origX + (e.clientX - s.pointerX), y: s.origY + (e.clientY - s.pointerY) });
    };
    const onUp = (): void => { startRef.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent): void => {
    if (e.button !== 0) return;
    startRef.current = { pointerX: e.clientX, pointerY: e.clientY, origX: pos.x, origY: pos.y };
    e.preventDefault();
  };

  return { transform: `translate(${pos.x}px, ${pos.y}px)`, onPointerDown };
}
