import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import { getJobsWithCompany, getCompanyById } from '@/lib/data/static';
import { US_STATES } from '@/lib/states';
import { JobCard } from '@/components/JobCard';
import { getFleetReadings, unitsForPlant } from '@/lib/outages/fleet';
import {
  confidenceLabel,
  cycleMonths,
  formatLongDate,
  formatWindow,
  outageTypeLabel,
} from '@/lib/outages/format';
import { getOutageSchedule, getPlantOutageHistory } from '@/lib/outages/schedule';
import { calendarDays } from '@/lib/outages/dates';
import { highestUnitState, plantRollupLabel } from '@/lib/outages/unitState';
import {
  plantStatusBarClass,
  plantStatusDotClass,
  plantStatusLabel,
  plantStatusTextClass,
} from '@/lib/plants/statusUi';
import { OPERATOR_TO_COMPANY } from '@/lib/plants/operators';

export const revalidate = 3600;

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
  const title = `${plant.name} nuclear plant: outages, status and jobs | Nuclear Hustle`;
  const description = `${plant.name} is a ${unitCount}-unit nuclear power plant in ${plant.city}, ${stateName}, operated by ${plant.operator}. Refueling outages, reactor status, and open nuclear jobs at ${plant.name}.`;
  const url = `/plants/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Nuclear Hustle',
      locale: 'en_US',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@nuclearhustle',
      title,
      description,
      images: ['/opengraph-image'],
    },
  };
}

export default async function PlantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plant = plantsData.plants.find(p => p.id === slug);
  if (!plant) notFound();

  const readings = await getFleetReadings();
  const reportDate = readings.reportDate;

  const isRestarting = (plant as { restarting?: boolean }).restarting === true;
  const units = unitsForPlant(plant.units, readings, isRestarting);

  const knownUnits = units.filter(u => u.power !== null);
  const avgPower = knownUnits.length > 0
    ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
    : null;

  const status = highestUnitState(units.map(u => u.state));
  const rollupLabel = plantRollupLabel(units);
  const schedule = await getOutageSchedule();
  const plantUnits = schedule?.units.filter((unit) => unit.plantSlug === plant.id) ?? [];
  const history = await getPlantOutageHistory(plantUnits.map((unit) => unit.unitId));

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

  const statusColor = plantStatusTextClass(status);
  const dotColor = plantStatusDotClass(status);

  return (
    <div className="min-h-screen bg-canvas">

      {/* Breadcrumb */}
      <div className="border-b border-rule">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 font-mono text-xs text-secondary">
          <Link href="/outages" className="hover:text-ink transition-colors">Outage schedule</Link>
          <span className="text-rule">/</span>
          <Link href="/plants" className="hover:text-ink transition-colors">All Plants</Link>
          <span className="text-rule">/</span>
          <span className="text-secondary">{plant.name}</span>
        </div>
      </div>

      {/* Plant header */}
      <div className="border-b border-rule py-10">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-3">Nuclear Power Plant</p>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="font-sans text-3xl md:text-4xl font-bold text-ink mb-3">
                {plant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-secondary">
                <span>{plant.city}, {stateInfo?.name ?? plant.state}</span>
                <span aria-hidden="true">·</span>
                <span>{plant.operator}</span>
                <span aria-hidden="true">·</span>
                <span>{plant.units.length} reactor{plant.units.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 border border-rule bg-canvas">
              <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
              <div>
                <p className={`font-mono text-sm font-bold ${statusColor}`}>{rollupLabel}</p>
                {avgPower !== null && (
                  <p className="font-mono text-xs text-secondary">{avgPower}% average output</p>
                )}
                {reportDate && (
                  <p className="font-mono text-xs text-secondary mt-0.5">
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
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-4">Reactor Units</p>
              <div className="border border-rule divide-y divide-rule">
                {units.map(unit => {
                  const match = unit.nrcName.match(/\s(\d+)$/);
                  const label = match ? `Unit ${match[1]}` : unit.nrcName;
                  const uColor = plantStatusTextClass(unit.state);

                  return (
                    <div key={unit.nrcName} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-mono text-sm font-bold text-ink">{label}</p>
                        <p className="font-mono text-xs text-secondary mt-0.5">{unit.nrcName}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Power bar */}
                        <div className="hidden sm:block w-32">
                          <div className="h-1 bg-rule overflow-hidden">
                            <div
                              className={`h-full transition-all ${plantStatusBarClass(unit.state)}`}
                              style={{ width: `${unit.power ?? 0}%` }}
                            />
                          </div>
                        </div>
                        <p className={`font-sans text-lg font-semibold w-16 text-right ${uColor}`}>
                          {unit.power !== null ? `${unit.power}%` : 'n/a'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isRestarting && (
                <p className="font-sans text-sm text-secondary mt-3">
                  This plant is returning to commercial operation and may not appear in the current NRC operating feed.
                </p>
              )}
            </section>

            <section id="outages" className="scroll-mt-4">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-4">Outages</p>
              {plantUnits.length === 0 ? (
                <p className="font-sans text-sm text-secondary">Outage history is not loaded for this plant yet.</p>
              ) : (
                <div className="flex flex-col gap-8">
                  {plantUnits.map((unit) => {
                    const rows = history.get(unit.unitId) ?? [];
                    return (
                      <div key={unit.unitId} className="border border-rule">
                        <div className="flex flex-col gap-2 border-b border-rule px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="font-sans text-base font-semibold text-ink">{unit.unitLabel}</p>
                          <p className={`font-mono text-xs font-bold ${plantStatusTextClass(unit.state)}`}>
                            {plantStatusLabel(unit.state)}
                            {unit.current?.type === 'refueling' && unit.current.dayOfOutage
                              ? ` · Day ${unit.current.dayOfOutage}${
                                  unit.current.expectedReturn
                                    ? ` of ~${calendarDays(unit.current.startDate, unit.current.expectedReturn)}`
                                    : ''
                                }`
                              : ''}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
                          <div className="px-5 py-4">
                            <p className="font-mono text-xs uppercase tracking-widest text-secondary">Last refueling</p>
                            <p className="mt-1 font-sans text-sm text-ink">
                              {unit.lastRefueling
                                ? `${formatLongDate(unit.lastRefueling.startDate)}${unit.lastRefueling.endDate ? ` to ${formatLongDate(unit.lastRefueling.endDate)}` : ''}${unit.lastRefueling.durationDays ? `, ${unit.lastRefueling.durationDays} days` : ''}`
                                : 'None on record'}
                            </p>
                          </div>
                          <div className="px-5 py-4">
                            <p className="font-mono text-xs uppercase tracking-widest text-secondary">Next window</p>
                            <p className="mt-1 font-sans text-sm text-ink">
                              {unit.current?.type === 'refueling'
                                ? 'In outage now'
                                : unit.forecast?.dueNow
                                  ? 'Due now'
                                  : unit.forecast
                                    ? formatWindow(unit.forecast.windowStart, unit.forecast.windowEnd)
                                    : 'No forecast'}
                            </p>
                            <p className="mt-1 font-mono text-xs text-secondary">
                              {unit.cycleDays ? `${cycleMonths(unit.cycleDays)} month cycle` : 'Default 18 month cycle'}
                              {unit.forecast ? ` · ~${unit.forecast.durationDays} days · ${confidenceLabel(unit.forecast.confidence)}` : ''}
                            </p>
                          </div>
                        </div>
                        {rows.length > 0 && (
                          <table className="w-full border-t border-rule text-left">
                            <caption className="sr-only">Last outages for {unit.unitLabel}</caption>
                            <thead>
                              <tr className="border-b border-rule">
                                {['Type', 'Started', 'Ended', 'Days'].map((label) => (
                                  <th key={label} className="px-5 py-2 font-mono text-xs uppercase tracking-widest text-secondary">{label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row) => (
                                <tr key={`${row.startDate}-${row.type}`} className="border-b border-rule last:border-b-0">
                                  <td className="px-5 py-2 font-sans text-sm text-ink">{outageTypeLabel(row.type)}</td>
                                  <td className="px-5 py-2 font-mono text-xs text-ink">{formatLongDate(row.startDate)}</td>
                                  <td className="px-5 py-2 font-mono text-xs text-ink">{row.endDate ? formatLongDate(row.endDate) : 'Ongoing'}</td>
                                  <td className="px-5 py-2 font-mono text-xs text-ink">{row.durationDays ?? 'n/a'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Jobs section */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <p className="font-mono text-xs tracking-widest uppercase text-secondary">
                  Open Roles at {plant.operator}
                </p>
                {jobs.length > 0 && stateInfo && (
                  <Link
                    href={`/jobs/${stateInfo.slug}`}
                    className="font-sans text-sm text-secondary hover:text-ink"
                  >
                    {stateInfo.name} jobs →
                  </Link>
                )}
              </div>

              {jobs.length > 0 ? (
                <div className="border border-rule divide-y divide-rule">
                  {jobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="border border-rule px-6 py-8 text-center">
                  <p className="font-mono text-sm text-secondary">No open roles listed for {plant.operator} right now.</p>
                  {stateInfo && (
                    <Link
                      href={`/jobs/${stateInfo.slug}`}
                      className="inline-block mt-4 font-mono text-xs tracking-widest uppercase px-4 py-2 border border-rule text-secondary hover:bg-surface transition-colors"
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
            <div className="border border-rule">
              <div className="px-5 py-4 border-b border-rule">
                <p className="font-mono text-xs tracking-widest uppercase text-secondary">Plant Info</p>
              </div>
              <div className="divide-y divide-rule">
                <div className="px-5 py-3">
                  <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-0.5">Location</p>
                  <p className="font-mono text-sm text-ink">{plant.city}, {stateInfo?.name ?? plant.state}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-0.5">Operator</p>
                  <p className="font-mono text-sm text-ink">{plant.operator}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-0.5">Units</p>
                  <p className="font-mono text-sm text-ink">{plant.units.length} reactor{plant.units.length > 1 ? 's' : ''}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-0.5">Current Output</p>
                  <p className={`font-mono text-sm font-bold ${statusColor}`}>{rollupLabel}</p>
                  {avgPower !== null && (
                    <p className="font-mono text-xs text-secondary mt-0.5">{avgPower}% average output</p>
                  )}
                </div>
              </div>
            </div>

            {/* Operator info */}
            {company?.description && (
              <div className="border border-rule">
                <div className="px-5 py-4 border-b border-rule">
                  <p className="font-mono text-xs tracking-widest uppercase text-secondary">About {plant.operator}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="font-mono text-xs text-secondary leading-relaxed">{company.description}</p>
                  {jobs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-rule">
                      <p className="font-mono text-xs text-secondary mb-3">{jobs.length} open role{jobs.length > 1 ? 's' : ''} listed</p>
                      <Link
                        href={`/jobs/${stateInfo?.slug ?? ''}`}
                        className="block font-mono text-xs tracking-widest uppercase px-4 py-2 bg-signal text-ink font-bold hover:bg-signal-hover transition-colors text-center"
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
              <div className="border border-rule">
                <div className="px-5 py-4 border-b border-rule">
                  <p className="font-mono text-xs tracking-widest uppercase text-secondary">
                    Other Plants in {stateInfo?.name ?? plant.state}
                  </p>
                </div>
                <div className="divide-y divide-rule">
                  {siblingPlants.map(p => (
                    <Link
                      key={p.id}
                      href={`/plants/${p.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-surface transition-colors group"
                    >
                      <div>
                        <p className="font-mono text-xs font-bold text-ink group-hover:underline underline-offset-2">{p.name}</p>
                        <p className="font-mono text-xs text-secondary mt-0.5">{p.operator}</p>
                      </div>
                      <span className="font-mono text-xs text-secondary">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex flex-col gap-2">
              <Link
                href="/outages"
                className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-rule text-secondary hover:bg-surface transition-colors text-center"
              >
                ← Outage schedule
              </Link>
              {stateInfo && (
                <Link
                  href={`/jobs/${stateInfo.slug}`}
                  className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-rule text-secondary hover:bg-surface transition-colors text-center"
                >
                  {stateInfo.name} Jobs →
                </Link>
              )}
              <Link
                href="/plants"
                className="font-mono text-xs tracking-widest uppercase px-4 py-3 border border-rule text-secondary hover:bg-surface transition-colors text-center"
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
