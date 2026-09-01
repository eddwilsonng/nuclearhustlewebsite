import type { JobFit } from "@/lib/types";
import { hasUsableFit } from "@/lib/jobs/fit";

export function JobFitBlock({ fit }: { fit: JobFit }) {
  if (!hasUsableFit({ fit })) return null;

  return (
    <section>
      <h2 className="font-sans text-2xl font-bold text-ink">Good fit if</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-secondary">
        {fit.good.map((item) => (
          <li key={item} className="font-sans text-base leading-relaxed text-ink">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
