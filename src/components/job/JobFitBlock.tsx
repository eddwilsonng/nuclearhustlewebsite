import type { JobFit } from "@/lib/types";
import { hasUsableFit } from "@/lib/jobs/fit";
import { JobDescriptionSection } from "./JobDescriptionBlock";

export function JobFitBlock({ fit }: { fit: JobFit }) {
  if (!hasUsableFit({ fit })) return null;

  return (
    <JobDescriptionSection label="Why this role">
      <div>
        <p className="mb-3 font-mono text-[10px] tracking-widest uppercase text-stone-400">
          Good fit if
        </p>
        <ul className="list-disc space-y-3 pl-5 marker:text-stone-400">
          {fit.good.map((item) => (
            <li
              key={item}
              className="font-sans text-sm leading-relaxed text-stone-900"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </JobDescriptionSection>
  );
}
