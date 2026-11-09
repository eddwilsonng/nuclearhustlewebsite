import Link from "next/link";
import { cn } from "@/lib/cn";

export type SetupStep = {
  id: string;
  label: string;
  description?: string;
  done: boolean;
  href?: string;
  actionLabel?: string;
};

/**
 * Account setup progress. Status is printed as text ("Done" / "To do"); the
 * track is decorative. The first unfinished step carries the only action, so
 * the list reads as one next move rather than a column of buttons.
 */
export function SetupChecklist({
  title,
  steps,
  className,
}: {
  title: string;
  steps: SetupStep[];
  className?: string;
}) {
  const doneCount = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done);
  const headingId = `setup-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={headingId} className={cn("border border-control bg-raised", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <h2 id={headingId} className="font-sans text-base font-semibold text-ink">
          {title}
        </h2>
        <p className="font-mono text-xs text-secondary">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <div className="mx-5 mt-3 flex h-1 gap-1" aria-hidden="true">
        {steps.map((step) => (
          <span key={step.id} className={cn("h-full flex-1", step.done ? "bg-ink" : "bg-surface")} />
        ))}
      </div>
      <ol className="mt-3 divide-y divide-rule border-t border-rule">
        {steps.map((step, index) => {
          const isNext = step.id === nextStep?.id;
          return (
            <li
              key={step.id}
              aria-current={isNext ? "step" : undefined}
              className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <span
                  className={cn(
                    "mt-0.5 font-mono text-xs tabular-nums",
                    step.done ? "text-secondary" : "text-ink",
                  )}
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-sans text-sm",
                      step.done ? "text-secondary line-through decoration-rule" : "font-medium text-ink",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && !step.done ? (
                    <p className="mt-0.5 font-sans text-sm leading-relaxed text-secondary">
                      {step.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-7 sm:pl-0">
                {isNext && step.href ? (
                  <Link
                    href={step.href}
                    className="inline-flex min-h-10 items-center border border-control bg-raised px-3 font-sans text-sm font-semibold text-ink transition-[background-color,border-color] duration-150 hover:border-ink hover:bg-surface"
                  >
                    {step.actionLabel ?? step.label}
                  </Link>
                ) : null}
                <span className="font-mono text-xs text-secondary">{step.done ? "Done" : "To do"}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
