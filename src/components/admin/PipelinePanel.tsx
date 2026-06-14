import Link from 'next/link';

export interface PipelineStats {
  total: number;
  pending: number;
  published: number;
  rejected: number;
  high: number;
  low: number;
  bySource: { id: string; name: string; pending: number; published: number }[];
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`border ${accent ? 'border-yellow-400 bg-yellow-50' : 'border-[#CFC8BC] bg-white'} p-4`}>
      <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

function Bar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 bg-[#EDE8DF] border border-[#CFC8BC]">
      <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Content Review Pipeline process card for the Operations hub. */
export function PipelinePanel({ stats }: { stats: PipelineStats }) {
  return (
    <section className="border border-[#CFC8BC] bg-white">
      <div className="flex items-center justify-between border-b border-[#CFC8BC] bg-[#EDE8DF] px-5 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Process</p>
          <h2 className="font-mono text-sm font-bold text-stone-900">Content Review Pipeline</h2>
        </div>
        <Link
          href="/dashboard/admin/review"
          className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
        >
          Review &amp; approve →
        </Link>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Pending" value={stats.pending} accent={stats.pending > 0} />
          <Stat label="Published" value={stats.published} />
          <Stat label="Rejected" value={stats.rejected} />
          <Stat label="Flagged (low)" value={stats.low} />
        </div>

        {stats.pending > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">
                Confidence of pending
              </span>
              <span className="font-mono text-[10px] text-stone-500">
                {stats.high} high · {stats.low} flagged
              </span>
            </div>
            <Bar value={stats.high} total={stats.pending} />
          </div>
        )}

        {stats.bySource.length > 0 && (
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">By source</p>
            <div className="space-y-2">
              {stats.bySource.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-stone-600 w-40 truncate">{s.name}</span>
                  <div className="flex-1"><Bar value={s.published} total={s.pending + s.published || 1} /></div>
                  <span className="font-mono text-[10px] text-stone-400 w-28 text-right">
                    {s.pending} pending · {s.published} live
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
