import type { AgentRun } from '@/lib/ops/runLog';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

const TYPE_LABEL: Record<string, string> = {
  scrape: 'Scrape',
  'ai-review': 'AI Review',
  'review-action': 'Review',
};

function statsSummary(stats: Record<string, number>): string {
  const entries = Object.entries(stats).filter(([, v]) => typeof v === 'number');
  if (entries.length === 0) return '—';
  return entries.map(([k, v]) => `${v} ${k}`).join(' · ');
}

/** Generic "recent agent runs" timeline — any process that calls recordAgentRun appears here. */
export function AgentRunsPanel({ runs }: { runs: AgentRun[] }) {
  return (
    <section className="border border-[#CFC8BC] bg-white">
      <div className="border-b border-[#CFC8BC] bg-[#EDE8DF] px-5 py-3">
        <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Activity</p>
        <h2 className="font-mono text-sm font-bold text-stone-900">Recent agent runs</h2>
      </div>

      {runs.length === 0 ? (
        <p className="font-mono text-xs text-stone-400 px-5 py-8 text-center">
          No agent runs recorded yet. Run the scraper or content review to see activity here.
        </p>
      ) : (
        <div className="divide-y divide-[#CFC8BC]">
          {runs.map((run) => (
            <div key={run.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className={`font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                  run.status === 'error'
                    ? 'border-red-200 text-red-600 bg-red-50'
                    : 'border-[#CFC8BC] text-stone-500 bg-[#EDE8DF]'
                }`}
              >
                {TYPE_LABEL[run.type] ?? run.type}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-stone-900 truncate">{run.label}</p>
                <p className="font-mono text-[10px] text-stone-400 truncate">
                  {run.status === 'error' ? (run.note || 'failed') : statsSummary(run.stats)}
                </p>
              </div>
              <span className="font-mono text-[10px] text-stone-400 whitespace-nowrap">{timeAgo(run.finishedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
