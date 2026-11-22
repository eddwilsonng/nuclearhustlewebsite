"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useId } from "react";
import { cn } from "@/lib/cn";

export type Choice<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

/**
 * A single choice from a short list, with real radio semantics (arrow keys
 * move, the group submits under `name`). `cards` gives each option room for a
 * description; `segmented` is a compact inline switch for two or three words.
 */
export function ChoiceGroup<T extends string>({
  name,
  label,
  options,
  value,
  onValueChange,
  variant = "cards",
  columns,
  description,
}: {
  name: string;
  label: string;
  options: Choice<T>[];
  value: T;
  onValueChange: (value: T) => void;
  variant?: "cards" | "segmented";
  columns?: 2 | 3;
  description?: string;
}) {
  const labelId = useId();
  const descriptionId = useId();
  // Radio.Root is a span, so a wrapping <label> doesn't name it. Point each
  // radio at its own text instead.
  const optionId = (value: string, part: "label" | "description") => `${labelId}-${value}-${part}`;

  return (
    <div className="space-y-2">
      <p id={labelId} className="font-sans text-sm font-medium text-ink">
        {label}
      </p>
      {description ? (
        <p id={descriptionId} className="font-sans text-sm leading-relaxed text-secondary">
          {description}
        </p>
      ) : null}
      <RadioGroup
        name={name}
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          variant === "segmented"
            ? "flex border border-control"
            : cn(
                "grid grid-cols-1 gap-3",
                columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : null,
              ),
        )}
      >
        {options.map((option) =>
          variant === "segmented" ? (
            <label
              key={option.value}
              className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 px-3 font-sans text-sm text-secondary transition-colors duration-150 not-last:border-r not-last:border-rule hover:text-ink has-[[data-checked]]:bg-surface has-[[data-checked]]:font-medium has-[[data-checked]]:text-ink"
            >
              <Radio.Root
                value={option.value}
                aria-labelledby={optionId(option.value, "label")}
                className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-control bg-raised data-checked:border-ink"
              >
                <Radio.Indicator className="size-1.5 rounded-full bg-ink data-unchecked:hidden" />
              </Radio.Root>
              <span id={optionId(option.value, "label")}>{option.label}</span>
            </label>
          ) : (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 border border-control p-4 transition-colors duration-150 hover:border-ink has-[[data-checked]]:border-ink has-[[data-checked]]:bg-surface"
            >
              <Radio.Root
                value={option.value}
                aria-labelledby={optionId(option.value, "label")}
                aria-describedby={option.description ? optionId(option.value, "description") : undefined}
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-control bg-raised data-checked:border-ink"
              >
                <Radio.Indicator className="size-2 rounded-full bg-ink data-unchecked:hidden" />
              </Radio.Root>
              <span className="min-w-0">
                <span id={optionId(option.value, "label")} className="block font-sans text-sm font-semibold text-ink">
                  {option.label}
                </span>
                {option.description ? (
                  <span id={optionId(option.value, "description")} className="mt-1 block font-sans text-sm text-secondary">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          ),
        )}
      </RadioGroup>
    </div>
  );
}
