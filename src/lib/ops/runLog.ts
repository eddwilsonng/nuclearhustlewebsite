import * as fs from 'fs';
import * as path from 'path';

/**
 * Lightweight, file-based log of agent/process runs.
 *
 * Importable by both the Next app (server components / API routes) and the
 * standalone `scraper/*` tsx scripts. Backs the Operations dashboard's
 * "Recent agent runs" view. Local-only: stored as a root JSON file. When the
 * pipeline moves to Supabase this becomes an `agent_runs` table.
 */

export type AgentRunType = 'scrape' | 'ai-review' | 'review-action' | string;

export interface AgentRun {
  id: string;
  type: AgentRunType;
  label: string;
  status: 'success' | 'error';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stats: Record<string, number>;
  note?: string;
}

const RUNS_PATH = path.join(process.cwd(), '.agent-runs.json');
const MAX_RUNS = 200;

function readRaw(): AgentRun[] {
  try {
    const data = JSON.parse(fs.readFileSync(RUNS_PATH, 'utf-8'));
    return Array.isArray(data.runs) ? data.runs : [];
  } catch {
    return [];
  }
}

/** Append a completed run. Newest entries kept; file capped at MAX_RUNS. */
export function recordAgentRun(run: Omit<AgentRun, 'id'> & { id?: string }): void {
  const entry: AgentRun = {
    id: run.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...run,
  };
  const runs = [entry, ...readRaw()].slice(0, MAX_RUNS);
  try {
    fs.writeFileSync(RUNS_PATH, JSON.stringify({ runs }, null, 2) + '\n');
  } catch (err) {
    // Logging must never break the agent it's tracking.
    console.error('[runLog] failed to write run log:', err);
  }
}

/** Most-recent-first. */
export function readAgentRuns(limit = 50): AgentRun[] {
  return readRaw().slice(0, limit);
}

/**
 * Convenience wrapper that times a run, records success/error, and rethrows.
 * `compute` returns the stats object for the run.
 */
export async function withAgentRun(
  type: AgentRunType,
  label: string,
  compute: () => Promise<{ stats: Record<string, number>; note?: string }>
): Promise<void> {
  const startedAt = new Date();
  try {
    const { stats, note } = await compute();
    const finishedAt = new Date();
    recordAgentRun({
      type,
      label,
      status: 'success',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      stats,
      note,
    });
  } catch (err) {
    const finishedAt = new Date();
    recordAgentRun({
      type,
      label,
      status: 'error',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      stats: {},
      note: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
