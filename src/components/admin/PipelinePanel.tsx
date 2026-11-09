import { DashboardSection } from '@/components/dashboard/DashboardChrome';
import { StatRow } from '@/components/ui/StatRow';

export interface PipelineStats {
  total: number;
  pending: number;
  published: number;
  rejected: number;
  high: number;
  low: number;
  bySource: { id: string; name: string; pending: number; published: number }[];
}

/** Decorative share bar. The same numbers are printed beside it. */
function Track({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div aria-hidden="true" className="h-1.5 bg-surface">
      <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Content review pipeline numbers for the Operations overview. */
export function PipelinePanel({ stats }: { stats: PipelineStats }) {
  return (
    <DashboardSection title="Content review pipeline" className="mt-0">
      <StatRow
        stats={[
          { label: 'Pending', value: stats.pending, href: '/dashboard/admin/review' },
          { label: 'Published', value: stats.published },
          { label: 'Rejected', value: stats.rejected },
          { label: 'Flagged', value: stats.low, detail: 'Low confidence' },
        ]}
      />

      {stats.pending > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">Confidence of pending</p>
            <p className="font-mono text-xs text-secondary">
              {stats.high} high · {stats.low} flagged
            </p>
          </div>
          <Track value={stats.high} total={stats.pending} />
        </div>
      )}

      {stats.bySource.length > 0 && (
        <div className="mt-6">
          <h3 className="font-sans text-sm font-semibold text-ink">By source</h3>
          <ul className="mt-2 space-y-3">
            {stats.bySource.map((s) => (
              <li key={s.id}>
                <div className="mb-1 flex items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate font-sans text-sm text-ink">{s.name}</span>
                  <span className="shrink-0 font-mono text-xs text-secondary">
                    {s.pending} pending · {s.published} live
                  </span>
                </div>
                <Track value={s.published} total={s.pending + s.published} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardSection>
  );
}
