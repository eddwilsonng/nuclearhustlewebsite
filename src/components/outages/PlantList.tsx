import Link from 'next/link';
import type { PlantWithStatus } from '@/app/outages/page';
import { Badge } from '@/components/ui/Badge';
import type { UnitState } from '@/lib/outages/unitState';
import { plantStatusBadgeTone, plantStatusDotClass, unitPowerChipClass } from '@/lib/plants/statusUi';
import { US_STATES } from '@/lib/states';

const STATUS_ORDER: Record<UnitState, number> = {
  restarting: 0,
  extended_shutdown: 1,
  refueling_outage: 2,
  unplanned: 3,
  maintenance: 4,
  offline: 5,
  coastdown: 6,
  reduced: 7,
  full: 8,
  unknown: 9,
};

const GROUPS: { title: string; states: UnitState[] }[] = [
  { title: 'Restarting', states: ['restarting'] },
  {
    title: 'In outage',
    states: ['extended_shutdown', 'refueling_outage', 'unplanned', 'maintenance', 'offline'],
  },
  { title: 'Below full power', states: ['coastdown', 'reduced'] },
  { title: 'At full power', states: ['full'] },
  { title: 'No report', states: ['unknown'] },
];

/** Plants grouped by their highest-priority unit, each linking to its profile. */
export function PlantList({ plants }: { plants: PlantWithStatus[] }) {
  const sorted = [...plants].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name),
  );

  return (
    <div className="flex flex-col gap-10">
      {GROUPS.map((group) => {
        const members = sorted.filter((plant) => group.states.includes(plant.status));
        if (members.length === 0) return null;
        const showBadge = group.title !== 'At full power';
        return (
          <div key={group.title}>
            <div className="mb-3 flex items-baseline gap-3">
              <h3 className="font-sans text-lg font-semibold text-ink">{group.title}</h3>
              <p className="font-mono text-xs tabular-nums text-secondary">
                {members.length} {members.length === 1 ? 'plant' : 'plants'}
              </p>
            </div>
            <ul className="grid border-t border-rule lg:grid-cols-2 lg:gap-x-8">
              {members.map((plant) => (
                <PlantRow key={plant.id} plant={plant} showBadge={showBadge} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function PlantRow({ plant, showBadge }: { plant: PlantWithStatus; showBadge: boolean }) {
  const hasJobs = plant.jobCount > 0 && plant.stateSlug;
  const stateName = US_STATES.find((s) => s.code === plant.state)?.name ?? plant.state;

  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-b border-rule py-4 transition-colors duration-150 hover:bg-surface sm:px-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2.5">
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${plantStatusDotClass(plant.status)}`} />
          {/* Stretched link: the whole row opens the plant profile. */}
          <Link
            href={`/plants/${plant.id}`}
            className="truncate font-sans text-base font-semibold text-ink underline-offset-2 after:absolute after:inset-0 after:content-[''] group-hover:underline"
          >
            {plant.name}
          </Link>
        </p>
        <p className="mt-1 pl-4.5 font-mono text-xs text-secondary">
          {plant.city}, {plant.state}
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          {plant.operator}
        </p>
        {showBadge && (
          <div className="mt-2 pl-4.5">
            <Badge tone={plantStatusBadgeTone(plant.status)} className="whitespace-normal">
              {plant.rollupLabel}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5">
          {plant.units.map((unit) => {
            const match = unit.nrcName.match(/\s(\d+)$/);
            const label = match ? `Unit ${match[1]}` : 'Unit';
            return (
              <span
                key={unit.nrcName}
                title={label}
                className={`border px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums ${unitPowerChipClass(unit.power)}`}
              >
                <span className="sr-only">{label} </span>
                {unit.power !== null ? `${unit.power}%` : 'n/a'}
              </span>
            );
          })}
        </div>
        {new Set(plant.units.map((unit) => unit.power)).size > 1 && plant.avgPower !== null && (
          <p className="font-mono text-xs tabular-nums text-secondary">
            <span className="sr-only">Average output </span>
            {plant.avgPower}% avg
          </p>
        )}
        {hasJobs && (
          <Link
            href={`/jobs/${plant.stateSlug}`}
            aria-label={`${plant.jobCount} open ${plant.jobCount === 1 ? 'job' : 'jobs'} in ${stateName}`}
            className="relative z-10 inline-flex min-h-8 items-center gap-2 border border-control bg-raised px-2.5 font-sans text-sm font-semibold whitespace-nowrap text-ink transition-colors duration-150 hover:border-ink hover:bg-canvas"
          >
            <span aria-hidden="true" className="size-2 bg-signal ring-1 ring-signal-border" />
            {plant.jobCount} {plant.state} {plant.jobCount === 1 ? 'job' : 'jobs'}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </li>
  );
}
