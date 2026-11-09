import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export const fieldControlStyles =
  "min-h-11 w-full border border-control bg-raised px-3 py-2.5 font-sans text-base text-ink placeholder:text-muted transition-[background-color,border-color] duration-150 hover:border-ink focus:border-ink focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger";

export function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block font-sans text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}

export function FieldDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("font-sans text-sm leading-relaxed text-secondary", className)} {...props} />
  );
}

export function FieldError({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn("font-sans text-sm font-medium text-danger", className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldControlStyles, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldControlStyles, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldControlStyles, "min-h-28 resize-y", className)}
      {...props}
    />
  );
}

export function FormStatus({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("font-sans text-sm text-secondary", className)}
      {...props}
    />
  );
}

type FieldShellProps = {
  id: string;
  label: ReactNode;
  optional?: boolean;
  description?: ReactNode;
  error?: string;
  className?: string;
};

/** Ids for a control's help and error text, so both are announced with it. */
function describedBy(id: string, description?: ReactNode, error?: string) {
  return cn(description && `${id}-description`, error && `${id}-error`) || undefined;
}

function FieldShell({
  id,
  label,
  optional,
  description,
  error,
  className,
  children,
}: FieldShellProps & { children: ReactNode }) {
  return (
    <FieldGroup className={className}>
      <FieldLabel htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-secondary"> (optional)</span> : null}
      </FieldLabel>
      {children}
      {description ? <FieldDescription id={`${id}-description`}>{description}</FieldDescription> : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </FieldGroup>
  );
}

/** Label, input, help and error wired together. `name` defaults to `id`. */
export function TextField({
  id,
  label,
  optional,
  description,
  error,
  className,
  name,
  ...props
}: FieldShellProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell {...{ id, label, optional, description, error, className }}>
      <Input
        id={id}
        name={name ?? id}
        aria-describedby={describedBy(id, description, error)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function TextareaField({
  id,
  label,
  optional,
  description,
  error,
  className,
  name,
  ...props
}: FieldShellProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell {...{ id, label, optional, description, error, className }}>
      <Textarea
        id={id}
        name={name ?? id}
        aria-describedby={describedBy(id, description, error)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  optional,
  description,
  error,
  className,
  name,
  ...props
}: FieldShellProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell {...{ id, label, optional, description, error, className }}>
      <Select
        id={id}
        name={name ?? id}
        aria-describedby={describedBy(id, description, error)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldShell>
  );
}
