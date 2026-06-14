import * as fs from 'fs';
import * as path from 'path';
import { createScraper } from './scrapers';
import { getCompany } from './companies';
import { EnrichedJob, mergeCompanyJobs, fetchJobDescription } from './enrich';
import { closeBrowser, createContext, createPage } from './browser';
import { recordAgentRun } from '../src/lib/ops/runLog';

interface ScrapeStatus {
  status: 'running' | 'done' | 'error' | 'idle';
  company: string;
  companyName: string;
  startedAt: string;
  phase: string;
  jobsFound: number;
  newJobs: number;
  updatedJobs: number;
  completedAt: string | null;
  error: string | null;
}

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
const STATUS_PATH = path.join(__dirname, '..', '.scrape-status.json');
const COMPANIES_PATH = path.join(__dirname, '..', 'src', 'data', 'companies.json');

function writeStatus(status: ScrapeStatus) {
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSingle(companyId: string): Promise<void> {
  const company = getCompany(companyId);
  if (!company) {
    console.error(`Unknown company: ${companyId}`);
    process.exit(1);
  }

  const status: ScrapeStatus = {
    status: 'running',
    company: companyId,
    companyName: company.name,
    startedAt: new Date().toISOString(),
    phase: 'Initializing',
    jobsFound: 0,
    newJobs: 0,
    updatedJobs: 0,
    completedAt: null,
    error: null,
  };
  writeStatus(status);

  try {
    // Phase 1: Scrape
    status.phase = 'Scraping job listings';
    writeStatus(status);
    console.log(`Scraping ${company.name}...`);

    const scraper = createScraper(company);
    const result = await scraper.scrape();

    if (!result.success) {
      throw new Error(result.error || 'Scrape failed');
    }

    status.jobsFound = result.jobs.length;
    console.log(`Found ${result.jobs.length} jobs`);

    // Phase 2: Fetch descriptions for jobs without them
    status.phase = 'Fetching descriptions';
    writeStatus(status);

    const needDesc = result.jobs.filter((j) => !j.description);
    if (needDesc.length > 0) {
      console.log(`Fetching descriptions for ${needDesc.length} jobs...`);
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

    // Phase 3: Merge (status-preserving, relevance-filtered)
    status.phase = 'Merging results';
    writeStatus(status);

    const existing: EnrichedJob[] = fs.existsSync(JOBS_PATH)
      ? JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')).jobs || []
      : [];

    const now = new Date().toISOString();
    const { jobs: allJobs, stats } = mergeCompanyJobs(existing, companyId, result.jobs, now);

    fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs: allJobs }, null, 2) + '\n');

    // Update last_scraped in companies.json
    if (fs.existsSync(COMPANIES_PATH)) {
      const companiesData = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf-8'));
      const companyEntry = companiesData.companies?.find((c: { id: string }) => c.id === companyId);
      if (companyEntry) {
        companyEntry.last_scraped = now;
        fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companiesData, null, 2) + '\n');
      }
    }

    await closeBrowser();

    status.status = 'done';
    status.phase = 'Complete';
    status.newJobs = stats.new;
    status.updatedJobs = stats.updated;
    status.completedAt = new Date().toISOString();
    writeStatus(status);

    recordAgentRun({
      type: 'scrape',
      label: `Scrape — ${company.name}`,
      status: 'success',
      startedAt: status.startedAt,
      finishedAt: status.completedAt,
      durationMs: new Date(status.completedAt).getTime() - new Date(status.startedAt).getTime(),
      stats: { new: stats.new, updated: stats.updated, dropped: stats.dropped, kept: stats.kept },
    });

    console.log(
      `\nDone: ${stats.new} new (pending review), ${stats.updated} updated, ` +
        `${stats.dropped} filtered as non-nuclear, ${stats.kept} kept`
    );
    console.log(`Total ${allJobs.length} jobs saved`);
  } catch (error) {
    await closeBrowser().catch(() => {});

    status.status = 'error';
    status.phase = 'Failed';
    status.error = error instanceof Error ? error.message : 'Unknown error';
    status.completedAt = new Date().toISOString();
    writeStatus(status);

    recordAgentRun({
      type: 'scrape',
      label: `Scrape — ${company.name}`,
      status: 'error',
      startedAt: status.startedAt,
      finishedAt: status.completedAt,
      durationMs: new Date(status.completedAt).getTime() - new Date(status.startedAt).getTime(),
      stats: {},
      note: status.error,
    });

    console.error('Scrape failed:', error);
    process.exit(1);
  }
}

// Parse --company arg
const companyArg = process.argv.find((a) => a.startsWith('--company='));
const companyId = companyArg?.split('=')[1];

if (!companyId) {
  console.error('Usage: tsx scraper/run-single.ts --company=duke');
  process.exit(1);
}

runSingle(companyId).catch((err) => {
  console.error(err);
  process.exit(1);
});
