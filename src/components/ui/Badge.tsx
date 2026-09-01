import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeStyles = cva(
  "inline-flex min-h-6 items-center gap-1.5 border px-2 py-1 font-mono text-xs leading-none",
  {
    variants: {
      tone: {
        neutral: "border-rule text-secondary",
        featured: "border-signal bg-signal/20 text-ink",
        success: "border-success bg-success-surface text-success",
        danger: "border-danger bg-danger-surface text-danger",
        inverse: "border-white/30 bg-white/5 text-inverse-ink",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeStyles>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />;
}
