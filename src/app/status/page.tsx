import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import MapLoader from '@/components/status/MapLoader';
import { US_STATES } from '@/lib/states';
import { getActiveStates } from '@/lib/data/static';

export const metadata: Metadata = {
  title: 'US Nuclear Fleet Status — Nuclear Hustle',
  description: 'Live power output status for every commercial nuclear reactor in the United States, updated daily from NRC data.',
  alternates: { canonical: '/status' },
};

// Revalidate every hour
export const revalidate = 3600;

export interface UnitStatus {
  nrcName: string;
  power: number | null; // 0–100, null = no data
}

export interface PlantWithStatus {
  id: string;
  name: string;
  state: string;
  city: string;
  operator: string;
  lat: number;
  lng: number;
  units: UnitStatus[];
  avgPower: number | null;
  status: 'full' | 'reduced' | 'offline' | 'unknown' | 'restarting';
  jobCount: number;          // open jobs in this plant's state (0 = none)
  stateSlug: string | null;  // /jobs/[stateSlug], null if unmapped
}

export interface FleetStats {
  reportDate: string;
  totalUnits: number;
  fullPower: number;
  reduced: number;
  offline: number;
  unknown: number;
  restarting: number;
  fleetCapacity: number | null;
}

// Fetch + parse the NRC feed at most hourly, caching ONLY the small parsed
// result (unit -> power for the latest report date). The raw 365-day file is
// ~1.3MB; fetching it with `no-store` inside unstable_cache keeps that body out
// of the page's serialized RSC payload — otherwise it inflated /status past 2MB.
const getNrcStatus = unstable_cache(
  async (): Promise<{ status: Record<string, number>; reportDate: string }> => {
    let status: Record<string, number> = {};
    let reportDate = '';
    try {
      const res = await fetch(
        'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt',
        { cache: 'no-store' }
      );
      if (!res.ok) return { status, reportDate };

      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);

      // The NRC feed is ordered newest-first, but we don't rely on ordering:
      // single pass that tracks the maximum report date and collects the units
      // belonging to it. (A previous version assumed oldest-first and silently
      // served year-old data.) Skips line 0 (the "ReportDt|Unit|Power" header).
      let maxTime = -Infinity;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('|');
        if (parts.length < 3) continue;
        const date = parts[0]?.trim();
        if (!date) continue;
        const time = Date.parse(date);
        if (isNaN(time)) continue;

        const unit = parts[1]?.trim();
        const power = parseInt(parts[2]?.trim() ?? '', 10);

        if (time > maxTime) {
          // Newer report date than anything seen — reset and start collecting.
          maxTime = time;
          reportDate = date;
          status = {};
        }
        if (date === reportDate && unit && !isNaN(power)) {
          status[unit] = power;
        }
      }
    } catch {
      // NRC fetch failed — page will show "unknown" status
    }
    return { status, reportDate };
  },
  ['nrc-power-status'],
  { revalidate: 3600 }
);

function getPlantStatus(avgPower: number | null): PlantWithStatus['status'] {
  if (avgPower === null) return 'unknown';
  if (avgPower === 0) return 'offline';
  if (avgPower >= 95) return 'full';
  return 'reduced';
}

export default async function StatusPage() {
  const { status: nrcStatus, reportDate } = await getNrcStatus();

  // Open-job counts per state, so we only link plants where work actually
  // exists (most reactor states have no listings — linking them all dead-ends).
  const jobCountByCode = new Map<string, number>();
  for (const { state, count } of getActiveStates()) {
    if (state?.code) jobCountByCode.set(state.code, count);
  }

  // Enrich plant data with live status
  const plants: PlantWithStatus[] = plantsData.plants.map(plant => {
    const units: UnitStatus[] = plant.units.map(u => ({
      nrcName: u.nrcName,
      power: u.nrcName in nrcStatus ? nrcStatus[u.nrcName] : null,
    }));

    const knownUnits = units.filter(u => u.power !== null);
    const avgPower = knownUnits.length > 0
      ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
      : null;

    // Plants flagged as restarting (shut down, returning to service) aren't in
    // the NRC operating feed — surface them explicitly rather than as "unknown".
    const isRestarting = (plant as { restarting?: boolean }).restarting === true;

    return {
      ...plant,
      units,
      avgPower,
      status: isRestarting ? 'restarting' : getPlantStatus(avgPower),
      jobCount: jobCountByCode.get(plant.state) ?? 0,
      stateSlug: US_STATES.find(s => s.code === plant.state)?.slug ?? null,
    };
  });

  // "Hiring now" summary — distinct reactor states that have open roles.
  const hiringByState = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of plants) {
    if (p.jobCount > 0 && p.stateSlug && !hiringByState.has(p.state)) {
      hiringByState.set(p.state, {
        slug: p.stateSlug,
        name: US_STATES.find(s => s.code === p.state)?.name ?? p.state,
        count: p.jobCount,
      });
    }
  }
  const hiringChips = [...hiringByState.values()].sort((a, b) => b.count - a.count);
  const hiringJobTotal = hiringChips.reduce((s, c) => s + c.count, 0);

  // Fleet-wide stats are computed over OPERATING plants only (restarting plants
  // are tracked separately so the totals match the NRC operating fleet).
  const operatingUnits = plants
    .filter(p => p.status !== 'restarting')
    .flatMap(p => p.units);
  const restartingUnits = plants
    .filter(p => p.status === 'restarting')
    .flatMap(p => p.units);

  const knownUnits = operatingUnits.filter(u => u.power !== null);
  const fullPower = knownUnits.filter(u => u.power! >= 95).length;
  const reduced = knownUnits.filter(u => u.power! > 0 && u.power! < 95).length;
  const offline = knownUnits.filter(u => u.power === 0).length;
  const unknown = operatingUnits.length - knownUnits.length;
  const fleetCapacity = knownUnits.length > 0
    ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
    : null;

  const stats: FleetStats = {
    reportDate,
    totalUnits: operatingUnits.length,
    fullPower,
    reduced,
    offline,
    unknown,
    restarting: restartingUnits.length,
    fleetCapacity,
  };

  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Page header */}
      <div className="border-b border-[#CFC8BC] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Live data</p>
            <h1 className="font-mono text-2xl md:text-3xl font-bold text-stone-900">
              US Nuclear Fleet Status
            </h1>
            {stats.reportDate && (
              <p className="font-mono text-xs text-stone-400 mt-2">
                NRC report date: {stats.reportDate.split(' ')[0]}
              </p>
            )}
          </div>

          {/* Jump links */}
          <div className="flex items-center gap-3">
            <a
              href="#all-reactors"
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] hover:text-stone-900 transition-colors"
            >
              All reactors ↓
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#CFC8BC]">
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Fleet Capacity</p>
              <p className="font-mono text-3xl font-bold text-stone-900">
                {stats.fleetCapacity !== null ? `${stats.fleetCapacity}%` : '—'}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Full Power</p>
              <p className="font-mono text-3xl font-bold text-green-500">{stats.fullPower}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Reduced</p>
              <p className="font-mono text-3xl font-bold text-yellow-500">{stats.reduced}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Offline</p>
              <p className="font-mono text-3xl font-bold text-red-500">{stats.offline}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Restarting</p>
              <p className="font-mono text-3xl font-bold text-blue-500">{stats.restarting}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Operating</p>
              <p className="font-mono text-3xl font-bold text-stone-900">{stats.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring-now summary — links only to states that actually have openings */}
      {hiringChips.length > 0 && (
        <div className="border-b border-[#CFC8BC] bg-[#E5DFD5]">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-mono text-xs tracking-widest uppercase text-stone-500 shrink-0">
              <span className="text-yellow-600 font-bold">Hiring now</span>
              <span className="text-stone-300 mx-2">{'//'}</span>
              {hiringJobTotal} roles at plants in {hiringChips.length} states
            </p>
            <div className="flex flex-wrap gap-2">
              {hiringChips.map(chip => (
                <Link
                  key={chip.slug}
                  href={`/jobs/${chip.slug}`}
                  className="font-mono text-xs tracking-wide px-3 py-1.5 border border-[#CFC8BC] bg-[#EDE8DF] text-stone-700 hover:bg-yellow-400 hover:text-stone-900 hover:border-yellow-400 transition-colors"
                >
                  {chip.name}
                  <span className="text-stone-400 mx-1.5">·</span>
                  <span className="font-bold">{chip.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <MapLoader plants={plants} />

      {/* Plant-by-plant breakdown */}
      <div id="all-reactors" className="max-w-6xl mx-auto px-6 py-12 scroll-mt-4">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Plant breakdown</p>
        <h2 className="font-mono text-xl font-bold text-stone-900 mb-1">All reactors</h2>
        <p className="font-mono text-xs text-stone-400 mb-6">
          {stats.totalUnits} operating
          {stats.restarting > 0 && ` · ${stats.restarting} restarting`}
        </p>

        <div className="border border-[#CFC8BC]">
          {plants
            .sort((a, b) => {
              const order = { restarting: -1, offline: 0, reduced: 1, full: 2, unknown: 3 };
              return order[a.status] - order[b.status];
            })
            .map((plant) => {
              const hasJobs = plant.jobCount > 0 && plant.stateSlug;
              const rowClass = 'flex items-center justify-between gap-4 px-5 py-4 border-b border-[#CFC8BC] last:border-b-0';
              const inner = (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      plant.status === 'full'       ? 'bg-green-500' :
                      plant.status === 'reduced'    ? 'bg-yellow-400' :
                      plant.status === 'offline'    ? 'bg-red-500' :
                      plant.status === 'restarting' ? 'bg-blue-500' :
                      'bg-[#CFC8BC]'
                    }`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-mono text-sm font-bold text-stone-900 truncate group-hover:underline underline-offset-2">{plant.name}</p>
                        {plant.status === 'restarting' && (
                          <span className="shrink-0 font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border border-blue-200 text-blue-600 bg-blue-50">
                            Restarting
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-stone-400 mt-0.5">
                        {plant.city}, {plant.state}
                        <span className="text-stone-300 mx-1.5">{'//'}</span>
                        {plant.operator}
                      </p>
                    </div>
                  </div>

                  {/* Right: power bar + avg */}
                  <div className="shrink-0 flex items-center gap-4">
                    {/* Per-unit badges */}
                    <div className="hidden md:flex items-center gap-2">
                      {plant.units.map(unit => {
                        const match = unit.nrcName.match(/\s(\d+)$/);
                        const label = match ? `U${match[1]}` : '—';
                        return (
                          <div key={unit.nrcName} className="flex flex-col items-center gap-0.5">
                            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-wider">{label}</span>
                            <span className={`font-mono text-xs font-bold px-1.5 py-0.5 border ${
                              unit.power === null     ? 'border-[#CFC8BC] text-stone-300' :
                              unit.power === 0        ? 'border-red-200 text-red-500 bg-red-50' :
                              unit.power >= 95        ? 'border-green-200 text-green-600 bg-green-50' :
                              'border-yellow-200 text-yellow-500 bg-yellow-50'
                            }`}>
                              {unit.power !== null ? `${unit.power}%` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Power bar */}
                    <div className="hidden sm:block w-24">
                      <div className="h-1 bg-[#CFC8BC] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            plant.status === 'full'    ? 'bg-green-500' :
                            plant.status === 'reduced' ? 'bg-yellow-400' :
                            plant.status === 'offline' ? 'bg-red-500' :
                            'bg-[#CFC8BC]'
                          }`}
                          style={{ width: `${plant.avgPower ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Avg % */}
                    <p className={`font-mono text-sm font-bold w-12 text-right ${
                      plant.status === 'full'    ? 'text-green-600' :
                      plant.status === 'reduced' ? 'text-yellow-500' :
                      plant.status === 'offline' ? 'text-red-500' :
                      'text-stone-300'
                    }`}>
                      {plant.avgPower !== null ? `${plant.avgPower}%` : '—'}
                    </p>

                    {/* Jobs badge — fixed-width slot so the avg % column stays
                        aligned whether or not a row has openings */}
                    <div className="w-24 shrink-0 flex justify-end">
                      {hasJobs && (
                        <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-1 bg-yellow-400 text-stone-900 font-bold whitespace-nowrap">
                          {plant.jobCount} job{plant.jobCount === 1 ? '' : 's'} →
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              return hasJobs ? (
                <Link
                  key={plant.id}
                  href={`/jobs/${plant.stateSlug}`}
                  className={`${rowClass} hover:bg-[#E5DFD5] transition-colors group`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={plant.id} className={rowClass}>
                  {inner}
                </div>
              );
            })}
        </div>

        <p className="font-mono text-xs text-stone-400 mt-6">
          Source: US Nuclear Regulatory Commission daily power reactor status report. Data updated each morning.{' '}
          <a
            href="https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-600 transition-colors underline underline-offset-2"
          >
            NRC source ↗
          </a>
        </p>
      </div>
    </div>
  );
}
