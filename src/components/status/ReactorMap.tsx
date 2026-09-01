'use client';

import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PlantWithStatus } from '@/app/status/page';
import { plantMarkerFill } from '@/lib/plants/statusUi';

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

function markerColor(status: PlantWithStatus['status'], avgPower: number | null) {
  return plantMarkerFill(status, avgPower);
}

function markerRadius(unitCount: number) {
  return 8 + (unitCount - 1) * 3;
}

function plantLabel(plant: PlantWithStatus) {
  const power =
    plant.avgPower !== null ? `${plant.avgPower}% power` : 'power unknown';
  const jobs =
    plant.jobCount > 0
      ? `, ${plant.jobCount} job${plant.jobCount === 1 ? '' : 's'} in ${plant.state}`
      : ', no current openings';
  return `${plant.name}, ${plant.city}, ${plant.state}. ${power}${jobs}`;
}

interface TooltipState {
  plant: PlantWithStatus;
  x: number;
  y: number;
}

export default function ReactorMap({ plants }: ReactorMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const router = useRouter();

  function showTooltip(plant: PlantWithStatus, x: number, y: number) {
    setTooltip({ plant, x, y });
  }

  function openJobs(plant: PlantWithStatus) {
    if (plant.jobCount <= 0) return;
    const slug = STATE_SLUGS[plant.state];
    if (slug) router.push(`/jobs/${slug}`);
  }

  return (
    <div
      className="relative w-full select-none border-b border-rule bg-canvas"
      style={{ minHeight: 480 }}
      role="region"
      aria-label="Map of commercial US nuclear plants"
    >
      <p className="sr-only">
        Interactive map of US nuclear plants. Hiring plants are keyboard-focusable.
        Skip to the reactor list for the same links.
      </p>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 900 }}
        style={{ width: '100%', height: 'auto' }}
        viewBox="80 40 800 480"
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter((geo) => geo.id !== '02' && geo.id !== '15')
              .map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--surface)"
                  stroke="var(--rule)"
                  strokeWidth={0.5}
                  tabIndex={-1}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'var(--rule)' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
          }
        </Geographies>

        {plants.map((plant) => {
          const fill = markerColor(plant.status, plant.avgPower);
          const r = markerRadius(plant.units.length);
          const hasJobs = plant.jobCount > 0;
          return (
            <Marker key={plant.id} coordinates={[plant.lng, plant.lat]}>
              <g
                role={hasJobs ? 'link' : 'img'}
                tabIndex={hasJobs ? 0 : -1}
                aria-label={plantLabel(plant)}
                style={{ cursor: hasJobs ? 'pointer' : 'default' }}
                onMouseEnter={(e) => {
                  showTooltip(plant, e.clientX, e.clientY);
                }}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(e) => {
                  setFocusedId(plant.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  showTooltip(plant, rect.right, rect.top);
                }}
                onBlur={() => {
                  setFocusedId(null);
                  setTooltip(null);
                }}
                onClick={hasJobs ? () => openJobs(plant) : undefined}
                onKeyDown={(e) => {
                  if (!hasJobs) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openJobs(plant);
                  }
                }}
              >
                {focusedId === plant.id && (
                  <circle r={r + 7} fill="none" stroke="var(--focus)" strokeWidth={2} />
                )}
                {hasJobs && (
                  <circle r={r + 3} fill="none" stroke="var(--signal)" strokeWidth={2} />
                )}
                <circle
                  r={r}
                  fill={fill}
                  fillOpacity={0.9}
                  stroke="var(--canvas)"
                  strokeWidth={1.5}
                />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 border border-control bg-raised px-3 py-2.5"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="mb-0.5 font-sans text-sm font-semibold text-ink">
            {tooltip.plant.name}
          </p>
          <p className="mb-2 font-sans text-sm text-secondary">
            {tooltip.plant.city}, {tooltip.plant.state}
            <span className="mx-1" aria-hidden="true">
              ·
            </span>
            {tooltip.plant.operator}
          </p>
          <div className="mb-2 space-y-0.5 border-t border-rule pt-1.5">
            {tooltip.plant.units.map((unit) => {
              const pwr = unit.power;
              const match = unit.nrcName.match(/\s(\d+)$/);
              const label = match ? `Unit ${match[1]}` : unit.nrcName;
              return (
                <div
                  key={unit.nrcName}
                  className="flex justify-between gap-6 font-mono text-xs"
                >
                  <span className="text-secondary">{label}</span>
                  <span className="font-semibold text-ink">
                    {pwr !== null ? `${pwr}%` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-rule pt-1.5">
            {tooltip.plant.jobCount > 0 ? (
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                {tooltip.plant.jobCount} job
                {tooltip.plant.jobCount === 1 ? '' : 's'} in {tooltip.plant.state} — view
              </p>
            ) : (
              <p className="font-mono text-xs uppercase tracking-widest text-secondary">
                No current openings
              </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-4 border border-rule bg-canvas px-3 py-2">
        <ul className="flex flex-wrap items-center gap-5 font-mono text-xs uppercase tracking-widest text-secondary">
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" aria-hidden="true" />
            Full
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-signal" aria-hidden="true" />
            Reduced
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" aria-hidden="true" />
            Offline
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-ink" aria-hidden="true" />
            Restarting
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-rule" aria-hidden="true" />
            No data
          </li>
          <li className="flex items-center gap-1.5 border-l border-rule pl-5">
            <span
              className="inline-block size-2.5 rounded-full border-2 border-signal"
              aria-hidden="true"
            />
            Hiring
          </li>
        </ul>
      </div>
    </div>
  );
}

interface ReactorMapProps {
  plants: PlantWithStatus[];
}
