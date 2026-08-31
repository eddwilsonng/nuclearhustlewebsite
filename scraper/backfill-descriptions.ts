/**
 * Fetch missing descriptions for published jobs, then format them.
 * Jobs that still have no body after fetch are held (pending_review) so
 * they don't go live as generic stubs.
 *
 *   npx tsx scraper/backfill-descriptions.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { createContext, createPage, closeBrowser } from './browser';
import { fetchJobDescription } from './enrich';
import { formatJobDescriptionLocal } from '../src/lib/formatJobDescriptionLocal';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');

interface Job {
  id: string;
  title: string;
  url: string;
  description?: string;
  company_id: string;
  slug: string;
  status?: string;
  structured_description?: unknown;
  review_notes?: string;
  agent_confidence?: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as { jobs: Job[] };
  const missing = data.jobs.filter(
    (j) => j.status === 'published' && (!j.description || j.description.length < 80),
  );

  console.log(`Fetching descriptions for ${missing.length} published stubs...`);

  const context = await createContext();
  const page = await createPage(context);

  let got = 0;
  let failed = 0;

  for (const job of missing) {
    const description = await fetchJobDescription(page, job.url);
    if (description) {
      job.description = description;
      job.structured_description = formatJobDescriptionLocal(description, job.title);
      got++;
      console.log(`  ok   ${job.company_id.padEnd(18)} ${job.title.slice(0, 60)}`);
    } else {
      job.status = 'pending_review';
      job.agent_confidence = 'low';
      job.review_notes = 'Local review: held — description fetch failed';
      failed++;
      console.log(`  fail ${job.company_id.padEnd(18)} ${job.title.slice(0, 60)}`);
    }
    await sleep(400);
    fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');
  }

  await page.close();
  await context.close();
  await closeBrowser();

  console.log(`\nFetched ${got}, held ${failed}`);
}

main().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
