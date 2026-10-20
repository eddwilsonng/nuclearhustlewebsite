import { cn } from '@/lib/cn';

/**
 * Day count against a unit's usual refueling length. The track ends at the
 * usual length; a run past it extends in danger beyond a tick. Decorative:
 * the same facts are printed as text beside it.
 */
export function OutageProgress({ day, typical }: { day: number; typical: number | null }) {
  if (!typical) return null;
  const scale = Math.max(day, typical);
  const within = (Math.min(day, typical) / scale) * 100;
  const over = day > typical ? ((day - typical) / scale) * 100 : 0;

  return (
    <div aria-hidden="true" className="relative mt-2 h-2 w-full max-w-56 bg-surface">
      <span className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${within}%` }} />
      {over > 0 && (
        <>
          <span className="absolute inset-y-0 bg-danger" style={{ left: `${within}%`, width: `${over}%` }} />
          <span className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `calc(${within}% - 1px)` }} />
        </>
      )}
    </div>
  );
}

export const FORECAST_HORIZON_DAYS = 90;

/** Day offsets 30 and 60, drawn as faint guides on every forecast track. */
const GUIDES = [30, 60];

function pct(offset: number): number {
  return (Math.min(Math.max(offset, 0), FORECAST_HORIZON_DAYS) / FORECAST_HORIZON_DAYS) * 100;
}

/** Column header scale for the forecast tracks. */
export function ForecastScale() {
  return (
    <div aria-hidden="true" className="relative h-4 w-full font-mono text-xs normal-case tracking-normal text-secondary">
      <span className="absolute left-0">Today</span>
      {GUIDES.map((offset) => (
        <span key={offset} className="absolute -translate-x-1/2" style={{ left: `${pct(offset)}%` }}>
          {offset}d
        </span>
      ))}
      <span className="absolute right-0">{FORECAST_HORIZON_DAYS}d</span>
    </div>
  );
}

/**
 * A forecast window on a today-to-90-days track: the band is the window, the
 * tick is the most likely start. Offsets are days from the report date.
 */
export function ForecastTrack({
  windowStart,
  windowEnd,
  start,
  emphasis,
}: {
  windowStart: number;
  windowEnd: number;
  start: number;
  emphasis?: boolean;
}) {
  const left = pct(windowStart);
  const right = pct(windowEnd);
  return (
    <div aria-hidden="true" className="relative h-3 w-full bg-surface">
      {GUIDES.map((offset) => (
        <span key={offset} className="absolute inset-y-0 w-px bg-rule" style={{ left: `${pct(offset)}%` }} />
      ))}
      <span
        className={cn('absolute inset-y-0', emphasis ? 'bg-signal' : 'bg-ink/20')}
        style={{ left: `${left}%`, width: `${Math.max(right - left, 1.5)}%` }}
      />
      <span
        className="absolute -inset-y-1 w-0.5 bg-ink"
        style={{ left: `calc(${pct(start)}% - ${start <= 0 ? 0 : 1}px)` }}
      />
    </div>
  );
}
