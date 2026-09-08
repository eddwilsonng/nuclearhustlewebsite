/**
 * Fetch missing descriptions for published + pending_review stubs.
 *
 * HTTP first (Workday CXS / SuccessFactors HTML), Playwright for JS-only
 * leftovers (Southern NLX, TVA TTC). Jobs that still have no body stay pending.
 *
 *   npx tsx scraper/backfill-descriptions.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { createContext, createPage, closeBrowser } from './browser';
import { fetchJobDescription, fetchJobDescriptionHttp } from './enrich';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');

interface Job {
  id: string;
  title: string;
  url: string;
  description?: string;
  company_id: string;
  slug: string;
  status?: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isStub(job: Job): boolean {
  return (
    (job.status === 'published' || job.status === 'pending_review') &&
    (!job.description || job.description.length < 80)
  );
}

async function main() {
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as { jobs: Job[] };
  const missing = data.jobs.filter(isStub);

  console.log(`Fetching descriptions for ${missing.length} stubs...`);

  let got = 0;
  let failed = 0;

  console.log('=== HTTP ===');
  for (const job of missing) {
    const description = await fetchJobDescriptionHttp(job.url);
    if (description) {
      job.description = description;
      got++;
      console.log(`  http  ${job.company_id.padEnd(18)} ${job.title.slice(0, 60)}`);
    }
    await sleep(120);
    if ((got + failed) % 25 === 0) {
      fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');
    }
  }
  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');

  const still = missing.filter((j) => !j.description || j.description.length < 80);
  if (still.length > 0) {
    console.log(`\n=== Playwright (${still.length}) ===`);
    const context = await createContext();
    const page = await createPage(context);
    for (const job of still) {
      const description = await fetchJobDescription(page, job.url);
      if (description) {
        job.description = description;
        got++;
        console.log(`  pw    ${job.company_id.padEnd(18)} ${job.title.slice(0, 60)}`);
      } else {
        failed++;
        console.log(`  fail  ${job.company_id.padEnd(18)} ${job.title.slice(0, 60)}`);
      }
      await sleep(400);
      fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');
    }
    await page.close();
    await context.close();
    await closeBrowser();
  }

  console.log(`\nFetched ${got}, still empty ${failed}`);
}

main().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
