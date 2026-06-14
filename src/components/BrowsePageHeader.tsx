import Link from 'next/link';

interface BrowsePageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/** Dark inverse header for browse/listing pages — separates wayfinding from content. */
export function BrowsePageHeader({ children, className }: BrowsePageHeaderProps) {
  return (
    <header className={`bg-stone-900 border-b border-stone-800 py-12 ${className ?? ''}`}>
      <div className="max-w-6xl mx-auto px-6">{children}</div>
    </header>
  );
}

export function BrowseBreadcrumb({ children }: { children: React.ReactNode }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 font-mono text-xs tracking-widest uppercase text-stone-500 mb-6">
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
    <Link href={href} className="text-stone-500 hover:text-[#EDE8DF] transition-colors">
      {children}
    </Link>
  );
}

export function BrowseBreadcrumbCurrent({ children }: { children: React.ReactNode }) {
  return <span className="text-stone-300">{children}</span>;
}

export function BrowseBreadcrumbTruncated({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-stone-300 truncate max-w-[12rem] sm:max-w-xs">{children}</span>
  );
}

export function BrowseBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-400/40 text-yellow-400 bg-yellow-400/10 px-2.5 py-1">
      {children}
    </span>
  );
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
      className="font-mono text-[10px] tracking-widest uppercase border border-stone-700 text-stone-400 px-2.5 py-1 hover:border-yellow-400/60 hover:text-yellow-400 transition-colors"
    >
      {children}
    </Link>
  );
}

export function BrowseChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase border border-stone-700 text-stone-400 px-2.5 py-1">
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
      className="font-semibold text-stone-200 hover:text-yellow-400 transition-colors"
    >
      {children}
    </Link>
  );
}

export function BrowseLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">
      {children}
    </p>
  );
}

export function BrowseTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-mono text-3xl md:text-4xl font-bold text-[#EDE8DF] mb-3 leading-tight">
      {children}
    </h1>
  );
}

export function BrowseMeta({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-sm text-stone-400 [&_strong]:text-stone-200">
      {children}
    </p>
  );
}

export function BrowseDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-sm text-stone-400 max-w-xl mt-3">{children}</p>
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
      className="font-mono text-xs tracking-widest uppercase text-yellow-400 border border-yellow-400/40 bg-yellow-400/10 hover:bg-yellow-400/20 px-3 py-1 transition-colors"
    >
      {children}
    </Link>
  );
}
