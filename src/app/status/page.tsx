import { Metadata } from 'next';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import MapLoader from '@/components/status/MapLoader';
import StateCapacityChart from '@/components/status/StateCapacityChart';
import { US_STATES } from '@/lib/states';

export const metadata: Metadata = {
  title: 'US Nuclear Fleet Status — Nuclear Hustle',
  description: 'Live power output status for every commercial nuclear reactor in the United States, updated daily from NRC data.',
  alternates: { canonical: 'https://nuclearhustle.com/status' },
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
  status: 'full' | 'reduced' | 'offline' | 'unknown';
}

export interface FleetStats {
  reportDate: string;
  totalUnits: number;
  fullPower: number;
  reduced: number;
  offline: number;
  unknown: number;
  fleetCapacity: number | null;
}

async function getNrcStatus(): Promise<{ statusMap: Map<string, number>; reportDate: string }> {
  const statusMap = new Map<string, number>();
  let reportDate = '';
  try {
    const res = await fetch(
      'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { statusMap, reportDate };

    const text = await res.text();
    const lines = text.trim().split(/\r?\n/);

    // Find the latest date by scanning from the end (data is chronological)
    let latestDate = '';
    for (let i = lines.length - 1; i >= 1; i--) {
      const date = lines[i].split('|')[0]?.trim();
      if (date) {
        if (!latestDate) {
          latestDate = date;
        } else if (date !== latestDate) {
          break;
        }
      }
    }

    if (!latestDate) return { statusMap, reportDate };
    reportDate = latestDate;

    // Only parse entries matching the latest date
    for (let i = lines.length - 1; i >= 1; i--) {
      const parts = lines[i].split('|');
      if (parts.length < 3) continue;
      const date = parts[0]?.trim();
      if (date !== latestDate) {
        if (statusMap.size > 0) break;
        continue;
      }
      const unit = parts[1]?.trim();
      const power = parseInt(parts[2]?.trim() ?? '', 10);
      if (unit && !isNaN(power)) {
        statusMap.set(unit, power);
      }
    }
  } catch {
    // NRC fetch failed — page will show "unknown" status
  }
  return { statusMap, reportDate };
}

function getPlantStatus(avgPower: number | null): PlantWithStatus['status'] {
  if (avgPower === null) return 'unknown';
  if (avgPower === 0) return 'offline';
  if (avgPower >= 95) return 'full';
  return 'reduced';
}

export default async function StatusPage() {
  const { statusMap: nrcStatus, reportDate } = await getNrcStatus();

  // Enrich plant data with live status
  const plants: PlantWithStatus[] = plantsData.plants.map(plant => {
    const units: UnitStatus[] = plant.units.map(u => ({
      nrcName: u.nrcName,
      power: nrcStatus.has(u.nrcName) ? nrcStatus.get(u.nrcName)! : null,
    }));

    const knownUnits = units.filter(u => u.power !== null);
    const avgPower = knownUnits.length > 0
      ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
      : null;

    return {
      ...plant,
      units,
      avgPower,
      status: getPlantStatus(avgPower),
    };
  });

  // Fleet-wide stats
  const allUnits = plants.flatMap(p => p.units);
  const knownUnits = allUnits.filter(u => u.power !== null);
  const fullPower = knownUnits.filter(u => u.power! >= 95).length;
  const reduced = knownUnits.filter(u => u.power! > 0 && u.power! < 95).length;
  const offline = knownUnits.filter(u => u.power === 0).length;
  const unknown = allUnits.length - knownUnits.length;
  const fleetCapacity = knownUnits.length > 0
    ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
    : null;

  const stats: FleetStats = {
    reportDate,
    totalUnits: allUnits.length,
    fullPower,
    reduced,
    offline,
    unknown,
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
                NRC report date: {stats.reportDate}
              </p>
            )}
          </div>

          {/* Jump links */}
          <div className="flex items-center gap-3">
            <a
              href="#by-state"
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] hover:text-stone-900 transition-colors"
            >
              By state ↓
            </a>
            <a
              href="#all-reactors"
              className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] text-stone-600 hover:bg-[#E5DFD5] hover:text-stone-900 transition-colors"
            >
              All {stats.totalUnits} reactors ↓
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-[#CFC8BC]">
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
              <p className="font-mono text-xs tracking-widest uppercase text-stone-300 mb-1">Total Reactors</p>
              <p className="font-mono text-3xl font-bold text-stone-900">{stats.totalUnits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapLoader plants={plants} />

      {/* State capacity chart */}
      <div id="by-state" className="border-b border-[#CFC8BC] scroll-mt-4">
        <StateCapacityChart plants={plants} />
      </div>

      {/* Plant-by-plant breakdown */}
      <div id="all-reactors" className="max-w-6xl mx-auto px-6 py-12 scroll-mt-4">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Plant breakdown</p>
        <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">All {stats.totalUnits} reactors</h2>

        <div className="border border-[#CFC8BC]">
          {plants
            .sort((a, b) => {
              const order = { offline: 0, reduced: 1, full: 2, unknown: 3 };
              return order[a.status] - order[b.status];
            })
            .map((plant) => {
              const stateInfo = US_STATES.find(s => s.code === plant.state);
              const jobsHref = stateInfo ? `/jobs/${stateInfo.slug}` : '/jobs';
              return (
              <Link
                key={plant.id}
                href={jobsHref}
                className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors group"
              >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      plant.status === 'full'    ? 'bg-green-500' :
                      plant.status === 'reduced' ? 'bg-yellow-400' :
                      plant.status === 'offline' ? 'bg-red-500' :
                      'bg-[#CFC8BC]'
                    }`} />
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-stone-900 truncate group-hover:underline underline-offset-2">{plant.name}</p>
                      <p className="font-mono text-xs text-stone-400 mt-0.5">
                        {plant.city}, {plant.state}
                        <span className="text-stone-300 mx-1.5">//</span>
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
                  </div>
              </Link>
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
