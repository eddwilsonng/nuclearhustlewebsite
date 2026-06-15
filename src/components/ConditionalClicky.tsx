'use client';

import { usePathname } from 'next/navigation';
import { Clicky } from './Clicky';

// Keep analytics on public / marketing pages only. The authenticated app
// (dashboard + onboarding) is excluded so we don't track logged-in usage.
// Login/signup stay tracked — they're public acquisition pages.
const EXCLUDE_PREFIXES = ['/dashboard', '/onboarding'];

export function ConditionalClicky() {
  const pathname = usePathname();
  const excluded = EXCLUDE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (excluded) return null;
  return <Clicky />;
}
