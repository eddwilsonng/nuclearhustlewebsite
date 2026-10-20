import { cn } from '@/lib/cn';

export interface FleetSegment {
  label: string;
  count: number;
  /** Background token class, matching the reactor map markers. */
  swatch: string;
  /** Listed in the legend even at zero, so a quiet day still reads as data. */
  alwaysShow?: boolean;
}

export interface FleetFigure {
  label: string;
  value: string;
  detail: string;
}

/**
 * Hero readout: four headline figures, then one cell per reactor unit grouped
 * by state. Same colours as the map markers; the legend carries the text.
 */
export function FleetSnapshot({
  figures,
  segments,
}: {
  figures: FleetFigure[];
  segments: FleetSegment[];
}) {
  const present = segments.filter((segment) => segment.count > 0);
  const listed = segments.filter((segment) => segment.count > 0 || segment.alwaysShow);
  const total = present.reduce((sum, segment) => sum + segment.count, 0);
  const summary = present.map((segment) => `${segment.count} ${segment.label.toLowerCase()}`).join(', ');

  return (
    <div className="mt-10">
      <dl className="grid grid-cols-2 border-y border-rule lg:grid-cols-4">
        {figures.map((figure, i) => (
          <div
            key={figure.label}
            className={cn(
              'border-rule py-5 pr-4',
              i % 2 === 1 && 'border-l pl-4 sm:pl-6',
              i >= 2 && 'border-t lg:border-t-0',
              i >= 1 && 'lg:border-l lg:pl-6',
            )}
          >
            <dt className="font-sans text-sm font-semibold text-ink">{figure.label}</dt>
            <dd className="mt-1 font-sans text-4xl font-bold tracking-tight tabular-nums text-ink md:text-5xl">
              {figure.value}
            </dd>
            <dd className="mt-2 font-mono text-xs text-secondary">{figure.detail}</dd>
          </div>
        ))}
      </dl>

      <div className="py-6">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">Every unit, by status</p>
          <p className="font-mono text-xs tabular-nums text-secondary">{total} units</p>
        </div>
        <div role="img" aria-label={`Fleet status by unit: ${summary}.`} className="flex h-7 gap-1">
          {present.map((segment) => (
            <div key={segment.label} className="flex min-w-1 gap-0 sm:gap-px" style={{ flexGrow: segment.count }}>
              {Array.from({ length: segment.count }, (_, i) => (
                <span key={i} className={cn('h-full flex-1', segment.swatch)} />
              ))}
            </div>
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-secondary">
          {listed.map((segment) => (
            <li key={segment.label} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn('size-2.5 shrink-0', segment.swatch)} />
              {segment.label}
              <span className="font-semibold tabular-nums text-ink">{segment.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
