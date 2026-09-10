import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 font-sans text-sm text-secondary">{description}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className={cn("border border-rule bg-raised p-6", className)}>{children}</div>
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
    <div className="border border-rule bg-raised px-6 py-12 text-center">
      <p className="font-sans text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-2 font-sans text-sm text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
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
