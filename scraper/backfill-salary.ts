/**
 * One-off backfill: derive `salary` for every existing job in jobs.json by
 * parsing its description. Safe to re-run — it only fills/refreshes the parsed
 * field and never overwrites a structured (ATS-sourced) salary.
 *
 *   npx tsx scraper/backfill-salary.ts
 */
import fs from 'fs';
import path from 'path';
import { parseSalary } from './parseSalary';
import type { EnrichedJob } from './enrich';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');

const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as { jobs: EnrichedJob[] };
let filled = 0;
let cleared = 0;

for (const job of data.jobs) {
  if (job.salary?.source === 'structured') continue; // never clobber ATS data
  const parsed = parseSalary(job.description);
  if (parsed && !job.salary) filled++;
  if (!parsed && job.salary) cleared++;
  job.salary = parsed;
}

fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs: data.jobs }, null, 2) + '\n');

const withSalary = data.jobs.filter((j) => j.salary).length;
console.log(
  `Backfill complete: ${data.jobs.length} jobs scanned, ${withSalary} now have salary ` +
    `(+${filled} filled, ${cleared} cleared as stale).`
);
