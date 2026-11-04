import { cn } from "@/lib/cn";

export const EMPLOYER_SETUP_STEPS = ["Create account", "Confirm email", "Company details", "Post a job"];

/**
 * "Step 2 of 4" for multi-step setup. The step names are printed, so the
 * position never depends on the decorative track alone.
 */
export function OnboardingSteps({
  steps,
  current,
  className,
}: {
  steps: string[];
  /** Zero-based index of the step on screen. */
  current: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">
        Step {current + 1} of {steps.length} · {steps[current]}
      </p>
      <ol className="mt-2 flex gap-1" aria-label="Setup steps">
        {steps.map((step, index) => (
          <li
            key={step}
            aria-current={index === current ? "step" : undefined}
            className={cn("h-1 flex-1", index <= current ? "bg-ink" : "bg-surface")}
          >
            <span className="sr-only">
              {step}
              {index < current ? " (done)" : index === current ? " (current)" : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
