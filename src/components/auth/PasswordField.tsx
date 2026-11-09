"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { FieldDescription, FieldError, FieldGroup, FieldLabel, Input } from "@/components/ui/Field";

export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete,
  description,
  error,
  required = true,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete: string;
  description?: string;
  error?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          minLength={autoComplete === "new-password" ? 8 : undefined}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="pr-20"
          aria-describedby={cn(description && descriptionId, error && errorId) || undefined}
          aria-invalid={error ? true : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 inline-flex min-h-11 -translate-y-1/2 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {description ? <FieldDescription id={descriptionId}>{description}</FieldDescription> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </FieldGroup>
  );
}
