"use client";

import { usePathname } from "next/navigation";

const HIDE_HEADER_PREFIXES = ["/dashboard"];

export function ConditionalHeader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = HIDE_HEADER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hide) return null;
  return children;
}
