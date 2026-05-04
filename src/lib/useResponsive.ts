import { useEffect, useState } from 'react';

export function useResponsive(): { isMobile: boolean } {
  const [isMobile, setIsMobile] = useState(() => check());
  useEffect(() => {
    const onResize = () => setIsMobile(check());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return { isMobile };
}

function check(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth < 768) return true;
  if (window.matchMedia?.('(pointer: coarse)').matches && window.innerWidth < 1024) return true;
  return false;
}
