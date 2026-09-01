'use client';

import { usePathname } from 'next/navigation';

const HIDE_FOOTER_PREFIXES = ['/dashboard', '/login', '/signup', '/onboarding'];

export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = HIDE_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (hide) return null;
  return children;
}
