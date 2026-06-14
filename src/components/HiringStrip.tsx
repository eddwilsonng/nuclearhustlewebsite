import Link from 'next/link';
import { getCompanies, getJobsByCompany } from '@/lib/data/static';

const FEATURED_OPERATOR_IDS = [
  'constellation',
  'duke',
  'dominion',
  'entergy',
  'nextera',
  'tva',
] as const;

const SHORT_NAMES: Record<(typeof FEATURED_OPERATOR_IDS)[number], string> = {
  constellation: 'Constellation',
  duke: 'Duke Energy',
  dominion: 'Dominion',
  entergy: 'Entergy',
  nextera: 'NextEra',
  tva: 'TVA',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function HiringStrip() {
  const companies = getCompanies().filter((c) =>
    FEATURED_OPERATOR_IDS.includes(c.id as (typeof FEATURED_OPERATOR_IDS)[number])
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
    <section className="border-b border-[#CFC8BC] bg-[#E5DFD5]">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">
              Hiring from
            </p>
            <p className="font-mono text-xs text-stone-500">
              America&apos;s largest nuclear operators
            </p>
          </div>
          <Link
            href="/companies"
            className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors shrink-0"
          >
            All operators →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#CFC8BC] border border-[#CFC8BC]">
          {operators.map((operator) => (
            <Link
              key={operator.id}
              href={`/companies/${operator.id}`}
              className="bg-[#E5DFD5] hover:bg-[#EDE8DF] px-3 py-4 flex flex-col items-center justify-center text-center gap-2 transition-colors group min-h-[88px]"
            >
              <div className="w-9 h-9 border border-[#CFC8BC] bg-[#EDE8DF] group-hover:border-stone-400 flex items-center justify-center transition-colors">
                <span className="font-mono text-[10px] font-bold text-stone-500 group-hover:text-stone-900 transition-colors">
                  {operator.initials}
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-stone-600 group-hover:text-stone-900 leading-tight transition-colors">
                {operator.shortName}
              </span>
              {operator.jobCount > 0 && (
                <span className="font-mono text-[10px] text-stone-400">
                  {operator.jobCount} open
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
