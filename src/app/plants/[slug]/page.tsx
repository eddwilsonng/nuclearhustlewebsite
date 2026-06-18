import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import { getNrcStatus, getPlantStatus } from '@/lib/nrc';
import { getJobsWithCompany, getCompanyById } from '@/lib/data/static';
import { US_STATES } from '@/lib/states';
import { JobCard } from '@/components/JobCard';

export const revalidate = 3600;

// Operator name → company id mapping
const OPERATOR_TO_COMPANY: Record<string, string> = {
  'Ameren': 'ameren',
  'Arizona Public Service': 'aps',
  'Constellation': 'constellation',
  'DTE Energy': 'dte',
  'Dominion Energy': 'dominion',
  'Duke Energy': 'duke',
  'Energy Northwest': 'energy-northwest',
  'Entergy': 'entergy',
  'Indiana Michigan Power': 'aep',
  'NPPD': 'nppd',
  'NextEra Energy': 'nextera',
  'PG&E': 'pge',
  'PSEG': 'pseg',
  'Southern Company': 'southern-nuclear',
  'TVA': 'tva',
  'Talen Energy': 'talen',
  'Vistra Energy': 'vistra',
  'Xcel Energy': 'xcel',
  'NRG Energy': 'nrg',
  'Evergy': 'evergy',
  'FirstEnergy': 'firstenergy',
  'Holtec International': 'holtec',
};

export async function generateStaticParams() {
  return plantsData.plants.map(p => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const plant = plantsData.plants.find(p => p.id === slug);
  if (!plant) return {};

  const unitCount = plant.units.length;
  const stateInfo = US_STATES.find(s => s.code === plant.state);
  const stateName = stateInfo?.name ?? plant.state;

  return {
    title: `${plant.name} Nuclear Power Plant — Jobs & Status`,
    description: `${plant.name} is a ${unitCount}-unit nuclear power plant in ${plant.city}, ${stateName}, operated by ${plant.operator}. Browse open nuclear jobs at ${plant.name}.`,
    alternates: { canonical: `/plants/${slug}` },
    openGraph: {
      title: `${plant.name} Nuclear Power Plant`,
      description: `${unitCount} reactor${unitCount > 1 ? 's' : ''} · ${plant.city}, ${stateName} · Operated by ${plant.operator}`,
    },
  };
}

export default async function PlantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plant = plantsData.plants.find(p => p.id === slug);
  if (!plant) notFound();

  const { status: nrcStatus, reportDate } = await getNrcStatus();

  const units = plant.units.map(u => ({
    nrcName: u.nrcName,
    power: u.nrcName in nrcStatus ? nrcStatus[u.nrcName] : null,
  }));

  const knownUnits = units.filter(u => u.power !== null);
  const avgPower = knownUnits.length > 0
    ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
    : null;

  const isRestarting = (plant as { restarting?: boolean }).restarting === true;
  const status = isRestarting ? 'restarting' : getPlantStatus(avgPower);

  const stateInfo = US_STATES.find(s => s.code === plant.state);
  const companyId = OPERATOR_TO_COMPANY[plant.operator];
  const company = companyId ? getCompanyById(companyId) : undefined;

  const jobs = companyId
    ? getJobsWithCompany({ companyId }).slice(0, 12)
    : [];

  // Other plants in the same state
  const siblingPlants = plantsData.plants
    .filter(p => p.state === plant.state && p.id !== plant.id)
    .slice(0, 5);

  const statusLabel = {
    full: 'Full Power',
    reduced: 'Reduced Output',
    offline: 'Offline',
    restarting: 'Restarting',
    unknown: 'Status Unknown',
  }[status];

  const statusColor = {
    full: 'text-green-600',
    reduced: 'text-yellow-500',
    offline: 'text-red-500',
    restarting: 'text-blue-500',
    unknown: 'text-stone-400',
  }[status];

  const dotColor = {
    full: 'bg-green-500',
    reduced: 'bg-yellow-400',
    offline: 'bg-red-500',
    restarting: 'bg-blue-500',
    unknown: 'bg-[#CFC8BC]',
  }[status];

  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Breadcrumb */}
      <div className="border-b border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 font-mono text-xs text-stone-400">
          <Link href="/status" className="hover:text-stone-600 transition-colors">Fleet Status</Link>
          <span className="text-[#CFC8BC]">/</span>
          <Link href="/plants" className="hover:text-stone-600 transition-colors">All Plants</Link>
          <span className="text-[#CFC8BC]">/</span>
          <span className="text-stone-600">{plant.name}</span>
        </div>
      </div>

      {/* Plant header */}
      <div className="border-b border-[#CFC8BC] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">Nuclear Power Plant</p>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 mb-3">
                {plant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-stone-500">
                <span>{plant.city}, {stateInfo?.name ?? plant.state}</span>
                <span className="text-[#CFC8BC]">//</span>
                <span>{plant.operator}</span>
                <span className="text-[#CFC8BC]">//</span>
                <span>{plant.units.length} reactor{plant.units.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 border border-[#CFC8BC] bg-[#EDE8DF]">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
              <div>
                <p className={`font-mono text-sm font-bold ${statusColor}`}>{statusLabel}</p>
                {avgPower !== null && (
                  <p className="font-mono text-xs text-stone-400">{avgPower}% avg output</p>
                )}
                {reportDate && (
                  <p className="font-mono text-[10px] text-stone-300 mt-0.5">
                    NRC {reportDate.split(' ')[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main column */}
          <div className="lg:col-span-2 flex flex-col gap-10">

            {/* Reactor units */}
            <section>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">Reactor Units</p>
              <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
                {units.map(unit => {
                  const match = unit.nrcName.match(/\s(\d+)$/);
                  const label = match ? `Unit ${match[1]}` : unit.nrcName;
                  const uStatus = getPlantStatus(unit.power);
                  const uColor = {
                    full: 'text-green-600',
                    reduced: 'text-yellow-500',
                    offline: 'text-red-500',
                    unknown: 'text-stone-300',
                  }[uStatus];

                  return (
                    <div key={unit.nrcName} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-mono text-sm font-bold text-stone-900">{label}</p>
                        <p className="font-mono text-xs text-stone-400 mt-0.5">{unit.nrcName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Power bar */}
                        <div className="hidden sm:block w-32">
                          <div className="h-1 bg-[#CFC8BC] overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                uStatus === 'full'    ? 'bg-green-500' :
                                uStatus === 'reduced' ? 'bg-yellow-400' :
                                uStatus === 'offline' ? 'bg-red-500' :
                                'bg-[#CFC8BC]'
                              }`}
                              style={{ width: `${unit.power ?? 0}%` }}
                            />
                          </div>
                        </div>
                        <p className={`font-mono text-lg font-bold w-16 text-right ${uColor}`}>
                          {unit.power !== null ? `${unit.power}%` : '—'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isRestarting && (
                <p className="font-mono text-xs text-blue-600 mt-3">
                  This plant is returning to commercial operation and may not appear in the current NRC operating feed.
                </p>
              )}
            </section>

            {/* Jobs section */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <p className="font-mono text-xs tracking-widest uppercase text-stone-400">
                  Open Roles at {plant.operator}
                </p>
                {jobs.length > 0 && stateInfo && (
                  <Link
                    href={`/jobs/${stateInfo.slug}`}
                    className="font-mono text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {stateInfo.name} jobs →
                  </Link>
                )}
              </div>

              {jobs.length > 0 ? (
                <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
                  {jobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="border border-[#CFC8BC] px-6 py-8 text-center">
                  <p className="font-mono text-sm text-stone-400">No open roles listed for {plant.operator} right now.</p>
                  {stateInfo && (
                    <Link
                      href={`/jobs/${stateInfo.slug}`}
                      className="inline-block mt-4 font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors"
                    >
                      Browse {stateInfo.name} jobs →
                    </Link>
                  )}
                </div>
              )}
            </section>

          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6">

            {/* Quick facts */}
            <div className="border border-[#CFC8BC]">
              <div className="px-5 py-4 border-b border-[#CFC8BC]">
                <p className="font-mono text-xs tracking-widest uppercase text-stone-400">Plant Info</p>
              </div>
              <div className="divide-y divide-[#CFC8BC]">
                <div className="px-5 py-3">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-300 mb-0.5">Location</p>
                  <p className="font-mono text-sm text-stone-700">{plant.city}, {stateInfo?.name ?? plant.state}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-300 mb-0.5">Operator</p>
                  <p className="font-mono text-sm text-stone-700">{plant.operator}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-300 mb-0.5">Units</p>
                  <p className="font-mono text-sm text-stone-700">{plant.units.length} reactor{plant.units.length > 1 ? 's' : ''}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-300 mb-0.5">Current Output</p>
                  <p className={`font-mono text-sm font-bold ${statusColor}`}>
                    {avgPower !== null ? `${avgPower}%` : '—'} · {statusLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Operator info */}
            {company?.description && (
              <div className="border border-[#CFC8BC]">
                <div className="px-5 py-4 border-b border-[#CFC8BC]">
                  <p className="font-mono text-xs tracking-widest uppercase text-stone-400">About {plant.operator}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="font-mono text-xs text-stone-500 leading-relaxed">{company.description}</p>
                  {jobs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#CFC8BC]">
                      <p className="font-mono text-xs text-stone-400 mb-3">{jobs.length} open role{jobs.length > 1 ? 's' : ''} listed</p>
                      <Link
                        href={`/jobs/${stateInfo?.slug ?? ''}`}
                        className="block font-mono text-xs tracking-widest uppercase px-4 py-2 bg-yellow-400 text-stone-900 font-bold hover:bg-yellow-300 transition-colors text-center"
                      >
                        Browse {stateInfo?.name ?? plant.state} Jobs →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other plants in state */}
            {siblingPlants.length > 0 && (
              <div className="border border-[#CFC8BC]">
                <div className="px-5 py-4 border-b border-[#CFC8BC]">
                  <p className="font-mono text-xs tracking-widest uppercase text-stone-400">
                    Other Plants in {stateInfo?.name ?? plant.state}
                  </p>
                </div>
                <div className="divide-y divide-[#CFC8BC]">
                  {siblingPlants.map(p => (
                    <Link
                      key={p.id}
                      href={`/plants/${p.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-[#E5DFD5] transition-colors group"
                    >
                      <div>
                        <p className="font-mono text-xs font-bold text-stone-700 group-hover:underline underline-offset-2">{p.name}</p>
                        <p className="font-mono text-[10px] text-stone-400 mt-0.5">{p.operator}</p>
                      </div>
                      <span className="font-mono text-[10px] text-stone-300">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-col gap-2">
              <Link
                href="/status"
                className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors text-center"
              >
                ← Fleet Status
              </Link>
              {stateInfo && (
                <Link
                  href={`/jobs/${stateInfo.slug}`}
                  className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors text-center"
                >
                  {stateInfo.name} Jobs →
                </Link>
              )}
              <Link
                href="/plants"
                className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] transition-colors text-center"
              >
                All Plants →
              </Link>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
