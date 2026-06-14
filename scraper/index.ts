import * as fs from 'fs';
import * as path from 'path';
import { createScraper } from './scrapers';
import { ScraperResult } from './types';
import { COMPANIES } from './companies';
import { EnrichedJob, mergeCompanyJobs, fetchJobDescription, MergeStats } from './enrich';
import { closeBrowser, createContext, createPage } from './browser';
import { recordAgentRun } from '../src/lib/ops/runLog';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
const COMPANIES_PATH = path.join(__dirname, '..', 'src', 'data', 'companies.json');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExisting(): EnrichedJob[] {
  if (!fs.existsSync(JOBS_PATH)) return [];
  try {
    return (JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')).jobs as EnrichedJob[]) || [];
  } catch {
    return [];
  }
}

async function runScrapers(): Promise<void> {
  console.log('Starting Nuclear Hustle job scraper...');
  console.log(`Scraping ${COMPANIES.length} companies\n`);

  const now = new Date().toISOString();
  let allJobs = loadExisting();
  const before = allJobs.length;
  console.log(`Loaded ${before} existing jobs (preserving status + structured descriptions)\n`);

  const results: ScraperResult[] = [];
  const totals: MergeStats = { new: 0, updated: 0, kept: 0, dropped: 0 };

  // Phase 1: scrape each company, fetch missing descriptions, merge (status-preserving).
  console.log('=== Phase 1: Scraping + merging per company ===\n');

  for (const company of COMPANIES) {
    try {
      const scraper = createScraper(company);
      const result = await scraper.scrape();
      results.push(result);

      // Fetch descriptions for jobs that arrived without one (API adapters include them).
      const needDesc = result.jobs.filter((j) => !j.description);
      if (needDesc.length > 0) {
        const context = await createContext();
        const page = await createPage(context);
        for (const job of needDesc) {
          const description = await fetchJobDescription(page, job.url);
          if (description) job.description = description;
          await sleep(500);
        }
        await page.close();
        await context.close();
      }

      const { jobs, stats } = mergeCompanyJobs(allJobs, company.id, result.jobs, now);
      allJobs = jobs;
      totals.new += stats.new;
      totals.updated += stats.updated;
      totals.kept += stats.kept;
      totals.dropped += stats.dropped;

      console.log(
        `${company.name}: ${result.jobs.length} scraped -> ` +
          `+${stats.new} new, ${stats.updated} updated, ${stats.dropped} filtered out` +
          `${result.success ? '' : ' [SCRAPE FAILED]'}`
      );

      await sleep(1000);
    } catch (error) {
      console.error(`Failed to scrape ${company.name}:`, error);
      results.push({
        companyId: company.id,
        jobs: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Persist.
  fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs: allJobs }, null, 2) + '\n');

  // Update last_scraped for successful companies.
  if (fs.existsSync(COMPANIES_PATH)) {
    const companiesData = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf-8'));
    for (const result of results) {
      if (!result.success) continue;
      const entry = companiesData.companies?.find((c: { id: string }) => c.id === result.companyId);
      if (entry) entry.last_scraped = now;
    }
    fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companiesData, null, 2) + '\n');
  }

  await closeBrowser();

  // Summary.
  const successCount = results.filter((r) => r.success).length;
  console.log('\n--- Summary ---');
  for (const result of results) {
    const company = COMPANIES.find((c) => c.id === result.companyId);
    const status = result.success ? 'OK' : 'FAILED';
    console.log(
      `${company?.name}: ${result.jobs.length} jobs [${status}]${result.error ? ` - ${result.error}` : ''}`
    );
  }
  console.log(
    `\nCompanies: ${successCount}/${results.length} succeeded\n` +
      `Jobs: ${before} -> ${allJobs.length} ` +
      `(+${totals.new} new pending review, ${totals.updated} updated, ${totals.dropped} filtered as non-nuclear)`
  );
  console.log(`Saved to ${JOBS_PATH}`);
  console.log('Browser closed.');

  const finishedAt = new Date();
  recordAgentRun({
    type: 'scrape',
    label: `Scrape — all sources (${successCount}/${results.length} ok)`,
    status: successCount > 0 ? 'success' : 'error',
    startedAt: now,
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - new Date(now).getTime(),
    stats: {
      new: totals.new,
      updated: totals.updated,
      dropped: totals.dropped,
      kept: totals.kept,
      companies: successCount,
    },
  });
}

runScrapers().catch(console.error);
