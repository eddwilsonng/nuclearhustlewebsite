"use client";

import { useState } from "react";
import { FieldDescription, FieldGroup, FieldLabel, Input } from "@/components/ui/Field";

export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete,
  description,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete: string;
  description?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="pr-20"
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
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </FieldGroup>
  );
}
