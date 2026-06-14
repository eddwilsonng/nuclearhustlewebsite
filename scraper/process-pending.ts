/**
 * Batch AI review pipeline for scraped jobs.
 *
 * Runs the two-pass agent (format -> review) over every job that is awaiting
 * review but hasn't been processed yet, writing structured_description,
 * review_notes, and agent_confidence back to jobs.json.
 *
 * Usage:
 *   npm run process-jobs                 # process all unprocessed pending jobs
 *   npm run process-jobs -- --limit=10   # process at most 10 (handy for a test run)
 *   npm run process-jobs -- --force      # re-process even jobs already structured
 *
 * Requires ANTHROPIC_API_KEY in .env.local.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { recordAgentRun } from '../src/lib/ops/runLog';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
const CONCURRENCY = 3;
const SAVE_EVERY = 5;

interface Job {
  id: string;
  title: string;
  company_id: string;
  category: string;
  description?: string;
  status?: string;
  structured_description?: unknown;
  review_notes?: string;
  agent_confidence?: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  return {
    limit: limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity,
    force: args.includes('--force'),
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set (.env.local). Aborting.');
    process.exit(1);
  }

  // Import after env is loaded — the AI clients read the key at module init.
  const { formatJobDescription } = await import('../src/lib/formatJobDescription');
  const { reviewJobDescription } = await import('../src/lib/reviewJobDescription');

  const { limit, force } = parseArgs();

  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as { jobs: Job[] };

  const queue = data.jobs.filter(
    (j) =>
      j.status === 'pending_review' &&
      j.description &&
      (force || !j.structured_description)
  );
  const targets = queue.slice(0, limit);

  if (targets.length === 0) {
    console.log('Nothing to process — no pending jobs awaiting AI review.');
    return;
  }

  console.log(
    `Processing ${targets.length} job(s) through the AI review pipeline ` +
      `(format + agent review, concurrency ${CONCURRENCY})...\n`
  );

  const startedAt = new Date();

  let done = 0;
  let processedSinceSave = 0;
  let lowCount = 0;
  let failCount = 0;

  // Index jobs by id for fast write-back.
  const indexById = new Map(data.jobs.map((j, i) => [j.id, i]));

  async function processOne(job: Job): Promise<void> {
    try {
      const formatted = await formatJobDescription(job.description!, job.title, job.company_id);
      const reviewed = await reviewJobDescription(formatted, job.title, job.company_id, job.category);

      const idx = indexById.get(job.id)!;
      data.jobs[idx] = {
        ...data.jobs[idx],
        structured_description: reviewed.structured_description,
        review_notes: reviewed.review_notes,
        agent_confidence: reviewed.agent_confidence,
        status: 'pending_review',
      };
      if (reviewed.agent_confidence === 'low') lowCount++;
      const flag = reviewed.agent_confidence === 'low' ? '⚠ ' : '  ';
      console.log(`${flag}[${++done}/${targets.length}] ${job.title.slice(0, 55)}`);
    } catch (err) {
      failCount++;
      console.log(`  ✗ [${++done}/${targets.length}] FAILED: ${job.title.slice(0, 50)} — ${err instanceof Error ? err.message : err}`);
    }

    if (++processedSinceSave >= SAVE_EVERY) {
      fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');
      processedSinceSave = 0;
    }
  }

  // Simple concurrency pool.
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < targets.length) {
      const job = targets[cursor++];
      await processOne(job);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Final save.
  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');

  const finishedAt = new Date();
  recordAgentRun({
    type: 'ai-review',
    label: `Content review — ${done} job${done === 1 ? '' : 's'}`,
    status: failCount === done && done > 0 ? 'error' : 'success',
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    stats: {
      processed: done,
      high: done - lowCount - failCount,
      low: lowCount,
      failed: failCount,
    },
  });

  console.log(
    `\nDone. Processed ${done} job(s): ${done - lowCount - failCount} high-confidence, ` +
      `${lowCount} flagged low-confidence, ${failCount} failed.`
  );
  console.log('Review them at /dashboard/admin/review');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
