import Link from "next/link";
import { getCompanies, getJobsByCompany } from "@/lib/data/static";

const FEATURED_OPERATOR_IDS = [
  "constellation",
  "duke",
  "dominion",
  "entergy",
  "nextera",
  "tva",
] as const;

const SHORT_NAMES: Record<(typeof FEATURED_OPERATOR_IDS)[number], string> = {
  constellation: "Constellation",
  duke: "Duke Energy",
  dominion: "Dominion",
  entergy: "Entergy",
  nextera: "NextEra",
  tva: "TVA",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HiringStrip() {
  const companies = getCompanies().filter((c) =>
    FEATURED_OPERATOR_IDS.includes(c.id as (typeof FEATURED_OPERATOR_IDS)[number]),
  );

  const operators = FEATURED_OPERATOR_IDS.map((id) => {
    const company = companies.find((c) => c.id === id);
    if (!company) return null;
    return {
      id,
      name: company.name,
      shortName: SHORT_NAMES[id],
      initials: getInitials(company.name),
      jobCount: getJobsByCompany(id).length,
    };
  }).filter(Boolean) as Array<{
    id: string;
    name: string;
    shortName: string;
    initials: string;
    jobCount: number;
  }>;

  return (
    <section className="border-b border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-sans text-sm font-semibold text-ink">
              Hiring from America’s largest nuclear operators
            </h2>
          </div>
          <Link
            href="/companies"
            className="font-sans text-sm text-secondary hover:text-ink"
          >
            All operators →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-6">
          {operators.map((operator) => (
            <Link
              key={operator.id}
              href={`/companies/${operator.id}`}
              className="flex min-h-[5.5rem] flex-col items-center justify-center gap-1 bg-surface px-3 py-4 text-center transition-colors duration-150 hover:bg-canvas"
            >
              <span className="font-sans text-sm font-semibold text-ink">
                {operator.shortName}
              </span>
              {operator.jobCount > 0 && (
                <span className="font-mono text-xs text-secondary">
                  <span className="tabular-nums text-ink">{operator.jobCount}</span>{" "}
                  open
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
