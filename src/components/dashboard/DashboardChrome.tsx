import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The one `h1` on a dashboard page. Sticky on desktop, where the content
 * scrolls inside its own pane; on phones the account bar is the sticky one.
 */
export function DashboardPageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** A parent page to return to, shown above the title. */
  back?: { href: string; label: string };
}) {
  return (
    <header className="z-10 border-b border-rule bg-canvas/95 px-5 py-4 backdrop-blur-sm md:sticky md:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {back ? (
            <Link
              href={back.href}
              className="mb-1 inline-flex min-h-8 items-center font-sans text-sm text-secondary hover:text-ink"
            >
              <span aria-hidden="true" className="mr-1">←</span>
              {back.label}
            </Link>
          ) : null}
          <h1 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-ink">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}

export function DashboardBody({
  children,
  width = "full",
  className,
}: {
  children: ReactNode;
  width?: "full" | "form";
  className?: string;
}) {
  // The outer box lines up with the page header; forms keep a readable measure
  // inside it.
  return (
    <div className={cn("mx-auto max-w-6xl px-5 py-6", className)}>
      {width === "form" ? <div className="max-w-3xl">{children}</div> : children}
    </div>
  );
}

/** A titled block within a dashboard page, with an optional link to see more. */
export function DashboardSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  const headingId = `dashboard-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className={cn("mt-10 first:mt-0", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="font-sans text-base font-semibold text-ink">
          {title}
        </h2>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex min-h-10 items-center font-sans text-sm text-secondary underline-offset-2 hover:text-ink hover:underline"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-dashed border-rule px-5 py-12 text-center", className)}>
      <h2 className="font-sans text-base font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md font-sans text-sm leading-relaxed text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}

export function DashboardAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border px-3 py-2.5 font-sans text-sm",
        tone === "error"
          ? "border-danger bg-danger-surface text-danger"
          : "border-success bg-success-surface text-success",
      )}
    >
      {children}
    </p>
  );
}

export function DashboardSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-widest text-secondary">
      {children}
    </p>
  );
}
