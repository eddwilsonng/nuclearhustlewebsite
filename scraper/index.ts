import * as fs from 'fs';
import * as path from 'path';
import { createScraper } from './scrapers';
import { ScraperResult } from './types';
import { COMPANIES, getActiveCompanies } from './companies';
import {
  EnrichedJob,
  mergeCompanyJobs,
  fetchJobDescription,
  MergeStats,
} from './enrich';
import { closeBrowser, createContext, createPage } from './browser';
import { recordAgentRun } from '../src/lib/ops/runLog';
import { invokedAsScript } from './cli';

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

export interface ScrapeRunResult {
  before: number;
  after: number;
  totals: MergeStats;
  successCount: number;
  companyCount: number;
  failedCompanies: { id: string; name: string; error?: string }[];
  skippedCompanies: string[];
  added: EnrichedJob[];
}

export async function runScrapers(): Promise<ScrapeRunResult> {
  const sources = getActiveCompanies();
  const skippedCompanies = COMPANIES.filter((c) => c.enabled === false).map((c) => c.name);

  console.log('Starting Nuclear Hustle job scraper...');
  console.log(`Scraping ${sources.length} companies`);
  if (skippedCompanies.length > 0) {
    console.log(`Skipping ${skippedCompanies.length} disabled: ${skippedCompanies.join(', ')}`);
  }
  console.log('');

  const now = new Date().toISOString();
  let allJobs = loadExisting();
  const before = allJobs.length;
  console.log(`Loaded ${before} existing jobs (preserving status + structured descriptions)\n`);

  const results: ScraperResult[] = [];
  const totals: MergeStats = { new: 0, updated: 0, kept: 0, dropped: 0 };
  const added: EnrichedJob[] = [];

  console.log('=== Phase 1: Scraping + merging per company ===\n');

  for (const company of sources) {
    try {
      const scraper = createScraper(company);
      const result = await scraper.scrape();
      results.push(result);

      const merged = mergeCompanyJobs(allJobs, company.id, result.jobs, now);
      allJobs = merged.jobs;
      added.push(...merged.added);
      totals.new += merged.stats.new;
      totals.updated += merged.stats.updated;
      totals.kept += merged.stats.kept;
      totals.dropped += merged.stats.dropped;

      // Descriptions only for newly added jobs (keyword-filtered). Never walk
      // the full ATS dump — Westinghouse can return 500 tiles with no body.
      const MAX_DESC = 30;
      const needDesc = merged.added.filter((j) => !j.description).slice(0, MAX_DESC);
      if (needDesc.length > 0) {
        const totalNew = merged.added.filter((j) => !j.description).length;
        console.log(
          `  Fetching descriptions for ${needDesc.length} new jobs` +
            (totalNew > MAX_DESC ? ` (capped from ${totalNew})` : '') +
            '...'
        );
        try {
          const context = await createContext();
          const page = await createPage(context);
          for (const job of needDesc) {
            const description = await fetchJobDescription(page, job.url);
            if (description) {
              job.description = description;
              const live = allJobs.find((j) => j.id === job.id);
              if (live) live.description = description;
            }
            await sleep(400);
          }
          await page.close();
          await context.close();
        } catch (err) {
          console.log(
            `  Description fetch skipped (${needDesc.length} jobs): ${err instanceof Error ? err.message : err}`
          );
        }
      }

      console.log(
        `${company.name}: ${result.jobs.length} scraped -> ` +
          `+${merged.stats.new} new, ${merged.stats.updated} updated, ${merged.stats.dropped} filtered out` +
          `${result.success ? '' : ' [SCRAPE FAILED]'}`
      );

      fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs: allJobs }, null, 2) + '\n');

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

  fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs: allJobs }, null, 2) + '\n');

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

  const successCount = results.filter((r) => r.success).length;
  const failedCompanies = results
    .filter((r) => !r.success)
    .map((r) => ({
      id: r.companyId,
      name: COMPANIES.find((c) => c.id === r.companyId)?.name ?? r.companyId,
      error: r.error,
    }));

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
  const { generateJobsIndex } = await import('./generate-jobs-index');
  const index = generateJobsIndex();
  console.log(`jobs-index.json: ${index.published} published jobs (${(index.bytes / 1024).toFixed(1)} KB)`);

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

  return {
    before,
    after: allJobs.length,
    totals,
    successCount,
    companyCount: results.length,
    failedCompanies,
    skippedCompanies,
    added,
  };
}

if (invokedAsScript('index.ts')) {
  runScrapers().catch(console.error);
}
