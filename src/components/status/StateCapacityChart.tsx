import Link from 'next/link';
import type { PlantWithStatus } from '@/app/status/page';

interface StateCapacityChartProps {
  plants: PlantWithStatus[];
}

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona', CA: 'California',
  CT: 'Connecticut', FL: 'Florida', GA: 'Georgia', IL: 'Illinois',
  KS: 'Kansas', LA: 'Louisiana', MD: 'Maryland', MI: 'Michigan',
  MN: 'Minnesota', MO: 'Missouri', MS: 'Mississippi', NC: 'North Carolina',
  NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey', NY: 'New York',
  OH: 'Ohio', PA: 'Pennsylvania', SC: 'South Carolina', TN: 'Tennessee',
  TX: 'Texas', VA: 'Virginia', WA: 'Washington', WI: 'Wisconsin',
};

// Map state code → URL slug (matches /jobs/[state] route)
const STATE_SLUGS: Record<string, string> = {
  AL: 'alabama', AR: 'arkansas', AZ: 'arizona', CA: 'california',
  CT: 'connecticut', FL: 'florida', GA: 'georgia', IL: 'illinois',
  KS: 'kansas', LA: 'louisiana', MD: 'maryland', MI: 'michigan',
  MN: 'minnesota', MO: 'missouri', MS: 'mississippi', NC: 'north-carolina',
  NE: 'nebraska', NH: 'new-hampshire', NJ: 'new-jersey', NY: 'new-york',
  OH: 'ohio', PA: 'pennsylvania', SC: 'south-carolina', TN: 'tennessee',
  TX: 'texas', VA: 'virginia', WA: 'washington', WI: 'wisconsin',
};

function unitColor(power: number | null): string {
  if (power === null) return '#CFC8BC';        // muted — no data
  if (power === 0)    return '#ef4444';        // red — offline
  if (power >= 95)    return '#22c55e';        // green — full power
  if (power >= 50)    return '#eab308';        // yellow — reduced
  return '#f97316';                            // orange — low
}

function unitBg(power: number | null): string {
  if (power === null) return 'rgba(207,200,188,0.2)';
  if (power === 0)    return 'rgba(239,68,68,0.08)';
  if (power >= 95)    return 'rgba(34,197,94,0.08)';
  if (power >= 50)    return 'rgba(234,179,8,0.08)';
  return 'rgba(249,115,22,0.08)';
}

function avgColor(avgPower: number | null): string {
  if (avgPower === null) return 'text-stone-400';
  if (avgPower === 0)    return 'text-red-500';
  if (avgPower >= 95)    return 'text-green-600';
  if (avgPower >= 50)    return 'text-yellow-600';
  return 'text-orange-500';
}

export default function StateCapacityChart({ plants }: StateCapacityChartProps) {
  // Group plants by state and compute state-level stats
  const stateMap = new Map<string, { plants: PlantWithStatus[]; units: { nrcName: string; power: number | null }[] }>();

  for (const plant of plants) {
    if (!stateMap.has(plant.state)) {
      stateMap.set(plant.state, { plants: [], units: [] });
    }
    const entry = stateMap.get(plant.state)!;
    entry.plants.push(plant);
    entry.units.push(...plant.units);
  }

  const stateRows = [...stateMap.entries()]
    .map(([state, { plants: statePlants, units }]) => {
      const known = units.filter(u => u.power !== null);
      const avgPower = known.length > 0
        ? Math.round(known.reduce((s, u) => s + u.power!, 0) / known.length)
        : null;
      return { state, plants: statePlants, units, avgPower };
    })
    .sort((a, b) => {
      if (a.avgPower === null && b.avgPower === null) return a.state.localeCompare(b.state);
      if (a.avgPower === null) return 1;
      if (b.avgPower === null) return -1;
      return b.avgPower - a.avgPower;
    });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-1">Reactor unit status</p>
          <h2 className="font-mono text-xl font-bold text-stone-900">Fleet output by state</h2>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-5 font-mono text-[10px] tracking-widest uppercase text-stone-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Full ≥95%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Reduced
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CFC8BC] inline-block" />No data
          </span>
        </div>
      </div>

      {/* State rows */}
      <div className="border border-[#CFC8BC]">
        {stateRows.map(({ state, units, avgPower }, i) => (
          <Link
            key={state}
            href={STATE_SLUGS[state] ? `/jobs/${STATE_SLUGS[state]}` : '/jobs'}
            className={`flex items-center gap-4 px-5 py-3.5 ${
              i < stateRows.length - 1 ? 'border-b border-[#CFC8BC]' : ''
            } hover:bg-[#E5DFD5] transition-colors group`}
          >
            {/* State */}
            <div className="w-28 shrink-0">
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-stone-900">{state}</span>
              <span className="font-mono text-[10px] text-stone-400 ml-2 hidden sm:inline">
                {STATE_NAMES[state] ?? ''}
              </span>
            </div>

            {/* Unit dots */}
            <div className="flex-1 flex items-center flex-wrap gap-1.5">
              {units.map((unit) => {
                const label = unit.nrcName.replace(/^.*\s(\d+)$/, 'U$1');
                return (
                  <div
                    key={unit.nrcName}
                    title={`${unit.nrcName}: ${unit.power !== null ? `${unit.power}%` : 'No data'}`}
                    style={{ background: unitBg(unit.power), borderColor: unitColor(unit.power) }}
                    className="flex items-center gap-1 px-2 py-1 border rounded-sm cursor-default"
                  >
                    <span
                      style={{ background: unitColor(unit.power) }}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                    />
                    <span className="font-mono text-[10px] tracking-wide" style={{ color: unitColor(unit.power) }}>
                      {unit.power !== null ? `${unit.power}%` : '—'}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400 hidden md:inline ml-0.5">{label}</span>
                  </div>
                );
              })}
            </div>

            {/* State avg + jobs link hint */}
            <div className="shrink-0 text-right w-28">
              <span className={`font-mono text-sm font-bold ${avgColor(avgPower)}`}>
                {avgPower !== null ? `${avgPower}%` : '—'}
              </span>
              <p className="font-mono text-[10px] text-stone-400 tracking-widest uppercase">avg</p>
              <p className="font-mono text-[9px] text-stone-300 group-hover:text-stone-500 transition-colors mt-0.5 tracking-widest uppercase">
                View jobs →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
