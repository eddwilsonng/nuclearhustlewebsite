import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A titled group of settings rows. One `h2` per section. */
export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `section-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className={cn("py-8 first:pt-0", className)}>
      <h2 id={headingId} className="font-sans text-lg font-semibold text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-secondary">{description}</p>
      ) : null}
      <div className="mt-5 divide-y divide-rule border-y border-rule">{children}</div>
    </section>
  );
}

/**
 * Label and help text on the left, the control on the right. Stacks below
 * `sm`, where the control takes the full width.
 */
export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  const LabelTag = htmlFor ? "label" : "p";
  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-8">
      <div className="min-w-0">
        <LabelTag {...(htmlFor ? { htmlFor } : {})} className="block font-sans text-sm font-medium text-ink">
          {label}
        </LabelTag>
        {description ? (
          <p className="mt-1 font-sans text-sm leading-relaxed text-secondary">{description}</p>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
