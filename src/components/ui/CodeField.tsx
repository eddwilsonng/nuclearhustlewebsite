"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { cn } from "@/lib/cn";
import { FieldDescription, FieldError } from "./Field";

/** One-time code entry: one box per digit, pasting a full code fills them all. */
export function CodeField({
  id,
  name,
  label,
  description,
  error,
  length = 6,
  autoSubmit,
  disabled,
}: {
  id: string;
  name: string;
  label: string;
  description?: string;
  error?: string;
  length?: number;
  autoSubmit?: boolean;
  disabled?: boolean;
}) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-sans text-sm font-medium text-ink">
        {label}
      </label>
      <OTPField.Root
        id={id}
        name={name}
        length={length}
        autoSubmit={autoSubmit}
        disabled={disabled}
        autoComplete="one-time-code"
        inputMode="numeric"
        aria-describedby={cn(description && descriptionId, error && errorId) || undefined}
        aria-invalid={error ? true : undefined}
        className="flex gap-2"
      >
        {Array.from({ length }, (_, index) => (
          <OTPField.Input
            key={index}
            aria-label={index === 0 ? undefined : `Digit ${index + 1} of ${length}`}
            className={cn(
              "size-12 border bg-raised text-center font-mono text-lg text-ink transition-[border-color] duration-150 hover:border-ink focus:border-ink focus:outline-none disabled:opacity-50",
              error ? "border-danger" : "border-control",
            )}
          />
        ))}
      </OTPField.Root>
      {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
