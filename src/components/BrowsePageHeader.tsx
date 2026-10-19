import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface BrowsePageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function BrowsePageHeader({ children, className }: BrowsePageHeaderProps) {
  return (
    <header className={cn("border-b border-rule bg-surface py-12", className)}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </header>
  );
}

export function BrowseBreadcrumb({ children }: { children: React.ReactNode }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted"
    >
      {children}
    </nav>
  );
}

export function BrowseBreadcrumbLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="hover:text-ink">
      {children}
    </Link>
  );
}

export function BrowseBreadcrumbCurrent({ children }: { children: React.ReactNode }) {
  return <span className="text-ink">{children}</span>;
}

export function BrowseBreadcrumbTruncated({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-[12rem] truncate text-ink sm:max-w-xs">
      {children}
    </span>
  );
}

export function BrowseBadge({ children }: { children: React.ReactNode }) {
  return <Badge tone="neutral">{children}</Badge>;
}

export function BrowseTagLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border border-control px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-secondary hover:border-ink hover:text-ink"
    >
      {children}
    </Link>
  );
}

export function BrowseChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-control px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-secondary">
      {children}
    </span>
  );
}

export function BrowseMetaLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-semibold text-ink hover:underline">
      {children}
    </Link>
  );
}

export function BrowseLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
      {children}
    </p>
  );
}

export function BrowseTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-3 font-sans text-3xl leading-tight font-bold tracking-tight text-ink md:text-4xl">
      {children}
    </h1>
  );
}

export function BrowseMeta({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-sm text-secondary [&_strong]:font-semibold [&_strong]:text-ink">
      {children}
    </p>
  );
}

export function BrowseDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-secondary">
      {children}
    </p>
  );
}

export function BrowseAlertLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="border border-control bg-raised px-3 py-1.5 font-sans text-sm text-ink transition-colors hover:border-ink hover:bg-canvas"
    >
      {children}
    </Link>
  );
}
