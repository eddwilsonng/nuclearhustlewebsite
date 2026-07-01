/**
 * One-off: submit every currently-published job URL to IndexNow.
 *
 * Ongoing publishes/expiries notify IndexNow automatically (see publish-job,
 * publish-jobs, and hygiene.ts), but those hooks only cover URLs that change
 * *after* IndexNow was wired up. This backfills everything already live.
 *
 * Usage: tsx scraper/indexnow-bootstrap.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { submitToIndexNow, jobUrl } from '../src/lib/indexnow';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');

interface Job {
  slug: string;
  status?: string;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as { jobs: Job[] };
  const slugs = data.jobs.filter((j) => !j.status || j.status === 'published').map((j) => j.slug);

  console.log(`Submitting ${slugs.length} published job URLs to IndexNow...`);
  await submitToIndexNow(slugs.map(jobUrl));
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
