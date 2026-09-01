import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonStyles = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 border px-5 py-2.5 font-sans text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-signal bg-signal text-ink hover:border-signal-hover hover:bg-signal-hover",
        secondary:
          "border-control bg-transparent text-ink hover:bg-surface",
        quiet:
          "border-transparent bg-transparent text-secondary hover:bg-surface hover:text-ink",
        danger:
          "border-danger bg-danger text-white hover:bg-danger/90",
      },
      size: {
        compact: "min-h-10 px-3 py-2 text-sm",
        standard: "min-h-11 px-5 py-2.5",
        large: "min-h-12 px-6 py-3 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "standard",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export function Button({
  className,
  variant,
  size,
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}
