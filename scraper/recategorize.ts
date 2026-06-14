/**
 * One-off / maintenance utility: re-runs categorizeJob() over every job in
 * src/data/jobs.json and rewrites the file. Use after changing categorization
 * rules in src/lib/categorize.ts, since the scraper preserves existing
 * categories on re-runs and won't otherwise reclassify historical jobs.
 *
 *   npx tsx scraper/recategorize.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { categorizeJob, type JobCategory } from '../src/lib/categorize';

const JOBS_PATH = join(process.cwd(), 'src/data/jobs.json');

interface JobRecord {
  title: string;
  category: JobCategory;
  [key: string]: unknown;
}

function main() {
  const raw = readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(raw) as { jobs: JobRecord[] };

  const before: Record<string, number> = {};
  const after: Record<string, number> = {};
  let changed = 0;

  for (const job of data.jobs) {
    const old = job.category;
    const next = categorizeJob(job.title);
    before[old] = (before[old] ?? 0) + 1;
    after[next] = (after[next] ?? 0) + 1;
    if (old !== next) changed++;
    job.category = next;
  }

  writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  console.log(`Re-categorized ${data.jobs.length} jobs (${changed} changed).`);
  console.log('Before:', before);
  console.log('After: ', after);
}

main();
