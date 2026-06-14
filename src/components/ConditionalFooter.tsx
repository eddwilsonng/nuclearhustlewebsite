'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

const HIDE_FOOTER_PREFIXES = ['/dashboard', '/login', '/signup', '/onboarding'];

export function ConditionalFooter() {
  const pathname = usePathname();
  const hide = HIDE_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (hide) return null;
  return <Footer />;
}
