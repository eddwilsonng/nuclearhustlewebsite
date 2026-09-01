import Link from "next/link";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { buttonStyles } from "./Button";

type LinkButtonProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonStyles>;

export function LinkButton({
  className,
  variant,
  size,
  fullWidth,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

type ExternalLinkButtonProps = ComponentProps<"a"> &
  VariantProps<typeof buttonStyles>;

export function ExternalLinkButton({
  className,
  variant,
  size,
  fullWidth,
  rel,
  ...props
}: ExternalLinkButtonProps) {
  return (
    <a
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      rel={rel ?? "noopener noreferrer"}
      {...props}
    />
  );
}
