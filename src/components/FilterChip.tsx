import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const chipStyles = (active: boolean) =>
  cn(
    "inline-flex min-h-9 items-center border px-3 py-1 font-sans text-sm",
    active
      ? "border-ink bg-surface text-ink"
      : "border-control text-secondary hover:border-ink hover:text-ink",
  );

export function FilterChip({
  href,
  children,
  count,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  count?: number;
  active?: boolean;
}) {
  return (
    <Link href={href} className={chipStyles(active)}>
      {children}
      {count != null && (
        <span
          className={cn(
            "ml-1.5 tabular-nums",
            active ? "text-ink" : "text-secondary",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function FilterChipButton({
  active = false,
  count,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  count?: number;
}) {
  return (
    <button type="button" className={cn(chipStyles(active), className)} {...props}>
      {children}
      {count != null && (
        <span
          className={cn(
            "ml-1.5 tabular-nums",
            active ? "text-ink" : "text-secondary",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
