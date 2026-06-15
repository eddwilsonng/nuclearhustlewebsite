'use client';

import { useEffect, useState } from 'react';

export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-[#EDE8DF] border-b transition-colors duration-200 ${
        scrolled ? 'border-[#CFC8BC]' : 'border-transparent'
      }`}
    >
      {children}
    </header>
  );
}
