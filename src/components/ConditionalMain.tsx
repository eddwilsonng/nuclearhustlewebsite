"use client";

import { usePathname } from "next/navigation";

/**
 * The dashboard renders its own <main> beside the sidebar, so its navigation
 * sits outside the main landmark. Every other page gets the shared one here.
 */
export function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }
  return (
    <main id="main-content" className="flex-1" tabIndex={-1}>
      {children}
    </main>
  );
}
