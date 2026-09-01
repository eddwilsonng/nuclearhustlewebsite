import { Metadata } from 'next';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import MapLoader from '@/components/status/MapLoader';
import { Badge } from '@/components/ui/Badge';
import { US_STATES } from '@/lib/states';
import { getActiveStates } from '@/lib/data/static';
import { getNrcStatus, getPlantStatus } from '@/lib/nrc';
import type { UnitStatus } from '@/lib/nrc';
import {
  plantStatusBarClass,
  plantStatusBadgeTone,
  plantStatusDotClass,
  plantStatusLabel,
  plantStatusTextClass,
  unitPowerChipClass,
} from '@/lib/plants/statusUi';

export type { UnitStatus } from '@/lib/nrc';

export const metadata: Metadata = {
  title: 'US Nuclear Fleet Status — Nuclear Hustle',
  description: 'Live power output status for every commercial nuclear reactor in the United States, updated daily from NRC data.',
  alternates: { canonical: '/status' },
};

// Revalidate every hour
export const revalidate = 3600;

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
    <div className="min-h-screen bg-canvas">

      {/* Page header */}
      <div className="border-b border-rule py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-2">Live data</p>
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-ink">
              US Nuclear Fleet Status
            </h1>
            {stats.reportDate && (
              <p className="font-mono text-xs text-secondary mt-2">
                NRC report date: {stats.reportDate.split(' ')[0]}
              </p>
            )}
          </div>

          {/* Jump links */}
          <div className="flex items-center gap-3">
            <a
              href="#all-reactors"
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-rule text-secondary hover:bg-surface hover:text-ink transition-colors"
            >
              All reactors ↓
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-rule">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-y md:divide-y-0 divide-rule">
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Fleet Capacity</p>
              <p className="font-sans text-3xl font-bold text-ink">
                {stats.fleetCapacity !== null ? `${stats.fleetCapacity}%` : '—'}
              </p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Full Power</p>
              <p className="font-sans text-3xl font-bold text-success">{stats.fullPower}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Reduced</p>
              <p className="font-sans text-3xl font-bold text-secondary">{stats.reduced}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Offline</p>
              <p className="font-sans text-3xl font-bold text-danger">{stats.offline}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Restarting</p>
              <p className="font-sans text-3xl font-bold text-ink">{stats.restarting}</p>
            </div>
            <div className="px-6 py-5">
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Operating</p>
              <p className="font-sans text-3xl font-bold text-ink">{stats.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hiring-now summary — links only to states that actually have openings */}
      {hiringChips.length > 0 && (
        <div className="border-b border-rule bg-surface">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-mono text-xs tracking-widest uppercase text-secondary shrink-0">
              <span className="text-ink font-bold">Hiring now</span>
              <span className="mx-2 text-secondary" aria-hidden="true">
                ·
              </span>
              {hiringJobTotal} roles at plants in {hiringChips.length} states
            </p>
            <div className="flex flex-wrap gap-2">
              {hiringChips.map(chip => (
                <Link
                  key={chip.slug}
                  href={`/jobs/${chip.slug}`}
                  className="font-mono text-xs tracking-wide px-3 py-1.5 border border-rule bg-canvas text-ink hover:bg-signal hover:text-ink hover:border-signal transition-colors"
                >
                  {chip.name}
                  <span className="text-secondary mx-1.5">·</span>
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
        <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-2">Plant breakdown</p>
        <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink mb-1">All reactors</h2>
        <p className="font-mono text-xs text-secondary mb-6">
          {stats.totalUnits} operating
          {stats.restarting > 0 && ` · ${stats.restarting} restarting`}
        </p>

        <div className="border border-rule">
          {plants
            .sort((a, b) => {
              const order = { restarting: -1, offline: 0, reduced: 1, full: 2, unknown: 3 };
              return order[a.status] - order[b.status];
            })
            .map((plant) => {
              const hasJobs = plant.jobCount > 0 && plant.stateSlug;
              const rowClass = 'flex items-center justify-between gap-4 px-5 py-4 border-b border-rule last:border-b-0 hover:bg-surface transition-colors group';

              return (
                <div key={plant.id} className={rowClass}>
                  {/* Left: name + meta — entire left section links to plant profile */}
                  <Link href={`/plants/${plant.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`size-2 shrink-0 rounded-full ${plantStatusDotClass(plant.status)}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="truncate font-sans text-sm font-semibold text-ink group-hover:underline underline-offset-2">
                          {plant.name}
                        </p>
                        <Badge tone={plantStatusBadgeTone(plant.status)} className="shrink-0">
                          {plantStatusLabel(plant.status)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-secondary">
                        {plant.city}, {plant.state}
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        {plant.operator}
                      </p>
                    </div>
                  </Link>

                  {/* Right: power data + jobs badge (not part of the plant link) */}
                  <div className="shrink-0 flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2">
                      {plant.units.map(unit => {
                        const match = unit.nrcName.match(/\s(\d+)$/);
                        const label = match ? `U${match[1]}` : '—';
                        return (
                          <div key={unit.nrcName} className="flex flex-col items-center gap-0.5">
                            <span className="font-mono text-xs text-secondary uppercase tracking-wider">{label}</span>
                            <span
                              className={`border px-1.5 py-0.5 font-mono text-xs font-bold ${unitPowerChipClass(unit.power)}`}
                            >
                              {unit.power !== null ? `${unit.power}%` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="hidden sm:block w-24">
                      <div className="h-1 bg-rule overflow-hidden">
                        <div
                          className={`h-full transition-all ${plantStatusBarClass(plant.status)}`}
                          style={{ width: `${plant.avgPower ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <p
                      className={`w-12 text-right font-mono text-sm font-bold ${plantStatusTextClass(plant.status)}`}
                    >
                      <span className="sr-only">{plantStatusLabel(plant.status)}, </span>
                      {plant.avgPower !== null ? `${plant.avgPower}%` : '—'}
                    </p>

                    <div className="w-24 shrink-0 flex justify-end">
                      {hasJobs ? (
                        <Link
                          href={`/jobs/${plant.stateSlug}`}
                          className="font-mono text-xs tracking-widest uppercase px-2 py-1 bg-signal text-ink font-bold whitespace-nowrap hover:bg-signal-hover transition-colors"
                        >
                          {`${plant.jobCount} job${plant.jobCount === 1 ? "" : "s"} →`}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <p className="font-mono text-xs text-secondary mt-6">
          Source: US Nuclear Regulatory Commission daily power reactor status report. Data updated each morning.{' '}
          <a
            href="https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-secondary transition-colors underline underline-offset-2"
          >
            NRC source ↗
          </a>
        </p>
      </div>
    </div>
  );
}
