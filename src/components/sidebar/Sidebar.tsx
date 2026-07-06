import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Shared sidebar primitives for browse / listing / company pages.
 *
 * Before this existed, the sidebar markup ("Other states", "Other roles",
 * employer nudge, alert capture) was hand-copied inline across six pages, so
 * every block looked the same and drift crept in. These primitives are the
 * single source of truth. Each block has a distinct visual role:
 *   - navigation  → SidebarNavList (neutral hairline list)
 *   - employer CTA → SidebarCTA (Rule 3 outline button)
 *   - alert capture → SidebarAlertCard (the one place subtle elevation is allowed)
 *
 * All are server-compatible (no client hooks) so pages stay server components.
 */

/** The sidebar column wrapper — sticky on desktop, consistent vertical rhythm. */
export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 self-start">
      {children}
    </aside>
  );
}

/** A labelled block with an optional "All X →" wayfinding footer link. */
export function SidebarSection({
  label,
  children,
  footerHref,
  footerLabel,
}: {
  label: string;
  children: ReactNode;
  footerHref?: string;
  footerLabel?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-3">
        {label}
      </p>
      {children}
      {footerHref && footerLabel && (
        <Link
          href={footerHref}
          className="block font-mono text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors mt-3"
        >
          {footerLabel}
        </Link>
      )}
    </div>
  );
}

export interface SidebarNavItem {
  href: string;
  label: string;
  count?: number;
  /** Marks the current page in the list (e.g. the state you're already on). */
  active?: boolean;
}

/** Bordered navigation list with right-aligned counts and a clear current state. */
export function SidebarNavList({ items }: { items: SidebarNavItem[] }) {
  return (
    <ul className="border border-[#CFC8BC]">
      {items.map((item) => (
        <li key={item.href} className="border-b border-[#CFC8BC] last:border-b-0">
          <Link
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 font-mono text-xs tracking-widest uppercase transition-colors ${
              item.active
                ? 'bg-[#E5DFD5] text-stone-900'
                : 'text-stone-500 hover:text-stone-900 hover:bg-[#E5DFD5]'
            }`}
          >
            <span className="truncate">{item.label}</span>
            {item.count != null && (
              <span
                className={`shrink-0 tabular-nums ${
                  item.active ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                {item.count}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Employer "post a job" nudge — Rule 3 outline CTA, visually distinct from navigation. */
export function SidebarCTA({
  label,
  body,
  href,
  ctaLabel = 'Post a job →',
}: {
  label: string;
  body: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div className="border border-[#CFC8BC] p-5">
      <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">
        {label}
      </p>
      <p className="font-sans text-sm leading-relaxed text-stone-500 mb-4">{body}</p>
      <Link
        href={href}
        className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 border border-[#CFC8BC] hover:border-stone-400 text-stone-500 hover:text-stone-900 transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

/**
 * Alert-capture card — the fallback conversion funnel on browse pages, where
 * there's no Apply button to compete with, so the CTA is filled yellow. This is
 * the one sidebar block allowed the subtle `card-raised` elevation + yellow tint
 * so it reads as the conversion moment, not just another navigation block.
 */
export function SidebarAlertCard({
  label = 'Free job alerts',
  body,
  href = '/signup',
  ctaLabel = 'Create free alert →',
}: {
  label?: string;
  body: string;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card-raised border border-yellow-300 bg-yellow-50 p-5">
      <p className="font-mono text-[10px] tracking-widest uppercase text-yellow-700 mb-2">
        {label}
      </p>
      <p className="font-sans text-sm leading-relaxed text-stone-500 mb-4">{body}</p>
      <Link
        href={href}
        className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
