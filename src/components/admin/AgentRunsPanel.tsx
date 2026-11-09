import type { AgentRun } from '@/lib/ops/runLog';
import { Badge } from '@/components/ui/Badge';
import { DashboardSection } from '@/components/dashboard/DashboardChrome';

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
  'ai-review': 'AI review',
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
    <DashboardSection title="Recent agent runs" className="mt-0">
      {runs.length === 0 ? (
        <p className="border border-dashed border-rule px-5 py-8 text-center font-sans text-sm text-secondary">
          No agent runs recorded yet. Run the scraper or content review to see activity here.
        </p>
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {runs.map((run) => {
            const failed = run.status === 'error';
            return (
              <li key={run.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 py-3">
                <Badge tone={failed ? 'danger' : 'neutral'}>{TYPE_LABEL[run.type] ?? run.type}</Badge>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm text-ink">{run.label}</p>
                  <p className="truncate font-mono text-xs text-secondary">
                    {failed ? `Failed: ${run.note || 'no details recorded'}` : statsSummary(run.stats)}
                  </p>
                </div>
                <time dateTime={run.finishedAt} className="whitespace-nowrap font-mono text-xs text-secondary">
                  {timeAgo(run.finishedAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
