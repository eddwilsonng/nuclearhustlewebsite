import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface BrowsePageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function BrowsePageHeader({ children, className }: BrowsePageHeaderProps) {
  return (
    <header className={cn("border-b border-white/10 bg-inverse py-12", className)}>
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </header>
  );
}

export function BrowseBreadcrumb({ children }: { children: React.ReactNode }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-inverse-ink/60"
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
    <Link href={href} className="text-inverse-ink/70 hover:text-inverse-ink">
      {children}
    </Link>
  );
}

export function BrowseBreadcrumbCurrent({ children }: { children: React.ReactNode }) {
  return <span className="text-inverse-ink">{children}</span>;
}

export function BrowseBreadcrumbTruncated({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-[12rem] truncate text-inverse-ink sm:max-w-xs">
      {children}
    </span>
  );
}

export function BrowseBadge({ children }: { children: React.ReactNode }) {
  return <Badge tone="inverse">{children}</Badge>;
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
      className="border border-white/20 px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-inverse-ink/80 hover:border-signal hover:text-inverse-ink"
    >
      {children}
    </Link>
  );
}

export function BrowseChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-white/20 px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-inverse-ink/80">
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
    <Link
      href={href}
      className="font-semibold text-inverse-ink hover:underline"
    >
      {children}
    </Link>
  );
}

export function BrowseLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-signal">
      {children}
    </p>
  );
}

export function BrowseTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="mb-3 font-sans text-3xl leading-tight font-bold text-inverse-ink md:text-4xl">
      {children}
    </h1>
  );
}

export function BrowseMeta({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-sans text-sm text-inverse-ink/75 [&_strong]:text-inverse-ink">
      {children}
    </p>
  );
}

export function BrowseDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-xl font-sans text-sm leading-relaxed text-inverse-ink/75">
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
      className="border border-signal/50 bg-signal/10 px-3 py-2 font-sans text-sm text-inverse-ink hover:bg-signal/20"
    >
      {children}
    </Link>
  );
}
