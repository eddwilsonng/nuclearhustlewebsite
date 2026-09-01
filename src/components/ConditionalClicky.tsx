'use client';

import { usePathname } from 'next/navigation';

const EXCLUDE_PREFIXES = ['/dashboard', '/onboarding'];

export function ConditionalClicky({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const excluded = EXCLUDE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (excluded) return null;
  return children;
}
