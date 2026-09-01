import Link from "next/link";
import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui/LinkButton";

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 self-start">
      {children}
    </aside>
  );
}

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
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-secondary">
        {label}
      </p>
      {children}
      {footerHref && footerLabel && (
        <Link
          href={footerHref}
          className="mt-3 block font-sans text-sm text-secondary hover:text-ink"
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
  active?: boolean;
}

export function SidebarNavList({ items }: { items: SidebarNavItem[] }) {
  return (
    <ul className="border border-rule">
      {items.map((item) => (
        <li key={item.href} className="border-b border-rule last:border-b-0">
          <Link
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 font-sans text-sm transition-colors ${
              item.active
                ? "bg-surface text-ink"
                : "text-secondary hover:bg-surface hover:text-ink"
            }`}
          >
            <span className="truncate">{item.label}</span>
            {item.count != null && (
              <span
                className={`shrink-0 tabular-nums ${
                  item.active ? "text-ink" : "text-muted"
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

export function SidebarCTA({
  label,
  body,
  href,
  ctaLabel = "Post a job →",
}: {
  label: string;
  body: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div className="border border-rule p-5">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        {label}
      </p>
      <p className="mb-4 font-sans text-sm leading-relaxed text-secondary">{body}</p>
      <LinkButton href={href} variant="secondary" fullWidth>
        {ctaLabel}
      </LinkButton>
    </div>
  );
}

export function SidebarAlertCard({
  label = "Free job alerts",
  body,
  href = "/signup",
  ctaLabel = "Create free alert →",
}: {
  label?: string;
  body: string;
  href?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card-raised border border-control bg-raised p-5">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        {label}
      </p>
      <p className="mb-4 font-sans text-sm leading-relaxed text-secondary">{body}</p>
      <LinkButton href={href} variant="primary" fullWidth>
        {ctaLabel}
      </LinkButton>
    </div>
  );
}
