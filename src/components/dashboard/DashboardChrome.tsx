import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DashboardPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-12 items-center justify-between gap-4 border-b border-rule bg-canvas/95 px-5 backdrop-blur-sm">
      <div className="min-w-0">
        <h1 className="truncate font-sans text-sm font-semibold text-ink">{title}</h1>
        {description ? (
          <p className="truncate font-sans text-sm text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
  return (
    <div
      className={cn(
        "px-5 py-5",
        width === "form" && "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-rule bg-raised p-5", className)}>{children}</div>
  );
}

export function DashboardEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-16 text-center">
      <p className="font-sans text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md font-sans text-sm text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
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
