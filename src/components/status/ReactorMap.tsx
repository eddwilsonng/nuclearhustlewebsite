'use client';

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlantWithStatus } from '@/app/status/page';

const STATE_SLUGS: Record<string, string> = {
  AL: 'alabama', AR: 'arkansas', AZ: 'arizona', CA: 'california',
  CT: 'connecticut', FL: 'florida', GA: 'georgia', IL: 'illinois',
  KS: 'kansas', LA: 'louisiana', MD: 'maryland', MI: 'michigan',
  MN: 'minnesota', MO: 'missouri', MS: 'mississippi', NC: 'north-carolina',
  NE: 'nebraska', NH: 'new-hampshire', NJ: 'new-jersey', NY: 'new-york',
  OH: 'ohio', PA: 'pennsylvania', SC: 'south-carolina', TN: 'tennessee',
  TX: 'texas', VA: 'virginia', WA: 'washington', WI: 'wisconsin',
};

const GEO_URL = '/us-states.json';

interface ReactorMapProps {
  plants: PlantWithStatus[];
}

function markerColor(status: PlantWithStatus['status'], avgPower: number | null) {
  if (status === 'restarting') return '#3b82f6';        // blue — returning to service
  if (status === 'unknown' || avgPower === null) return '#CFC8BC';
  if (avgPower === 0)       return '#ef4444';
  if (avgPower >= 95)       return '#22c55e';
  return '#eab308';
}

function markerRadius(unitCount: number) {
  return 8 + (unitCount - 1) * 3;
}

interface TooltipState {
  plant: PlantWithStatus;
  x: number;
  y: number;
}

export default function ReactorMap({ plants }: ReactorMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const router = useRouter();

  return (
    <div className="relative w-full bg-[#EDE8DF] border-b border-[#CFC8BC] select-none" style={{ minHeight: 480 }}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 900 }}
        style={{ width: '100%', height: 'auto' }}
        viewBox="80 40 800 480"
      >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies
                // Remove Alaska (02) and Hawaii (15) — no nuclear plants there
                .filter(geo => geo.id !== '02' && geo.id !== '15')
                .map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E5DFD5"
                    stroke="#CFC8BC"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: '#DDD8CF' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
            }
          </Geographies>

          {plants.map(plant => {
            const fill = markerColor(plant.status, plant.avgPower);
            const r    = markerRadius(plant.units.length);
            // Only plants in states with open roles are clickable — a yellow
            // ring marks them so the map doesn't lead anywhere empty.
            const hasJobs = plant.jobCount > 0;
            return (
              <Marker
                key={plant.id}
                coordinates={[plant.lng, plant.lat]}
                onMouseEnter={(e) => {
                  setTooltip({ plant, x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={hasJobs ? () => router.push(`/jobs/${STATE_SLUGS[plant.state] ?? ''}`) : undefined}
                tabIndex={-1}
              >
                {hasJobs && (
                  <circle r={r + 3} fill="none" stroke="#facc15" strokeWidth={2} />
                )}
                <circle
                  r={r}
                  fill={fill}
                  fillOpacity={0.9}
                  stroke="#EDE8DF"
                  strokeWidth={1.5}
                  style={{ cursor: hasJobs ? 'pointer' : 'default' }}
                />
              </Marker>
            );
          })}
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 bg-[#EDE8DF] border border-[#CFC8BC] px-3 py-2.5 shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-mono text-xs font-bold text-stone-900 mb-0.5">{tooltip.plant.name}</p>
          <p className="font-mono text-[10px] text-stone-400 mb-2">
            {tooltip.plant.city}, {tooltip.plant.state}
            <span className="mx-1 text-[#CFC8BC]">{'//'}</span>
            {tooltip.plant.operator}
          </p>
          <div className="border-t border-[#CFC8BC] pt-1.5 space-y-0.5 mb-2">
            {tooltip.plant.units.map(unit => {
              const pwr   = unit.power;
              const color = pwr === null ? '#CFC8BC' : pwr === 0 ? '#ef4444' : pwr >= 95 ? '#22c55e' : '#eab308';
              const match = unit.nrcName.match(/\s(\d+)$/);
              const label = match ? `Unit ${match[1]}` : unit.nrcName;
              return (
                <div key={unit.nrcName} className="flex justify-between gap-6 font-mono text-[10px]">
                  <span className="text-stone-400">{label}</span>
                  <span style={{ color, fontWeight: 700 }}>
                    {pwr !== null ? `${pwr}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#CFC8BC] pt-1.5">
            {tooltip.plant.jobCount > 0 ? (
              <p className="font-mono text-[10px] tracking-widest uppercase text-yellow-600 font-bold">
                {tooltip.plant.jobCount} job{tooltip.plant.jobCount === 1 ? '' : 's'} in {tooltip.plant.state} — view →
              </p>
            ) : (
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">
                No current openings
              </p>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-4 bg-[#EDE8DF] border border-[#CFC8BC] px-3 py-2">
        <div className="flex items-center gap-5 font-mono text-[10px] tracking-widest uppercase text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Full
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />Reduced
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Restarting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CFC8BC] inline-block" />No data
          </span>
          <span className="flex items-center gap-1.5 border-l border-[#CFC8BC] pl-5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-yellow-400 inline-block" />Hiring
          </span>
        </div>
      </div>
    </div>
  );
}
