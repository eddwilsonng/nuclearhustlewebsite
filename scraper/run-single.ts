import * as fs from 'fs';
import * as path from 'path';
import { createScraper } from './scrapers';
import { CompanyConfig, ScrapedJob } from './types';
import { categorizeJob, JobCategory } from '../src/lib/categorize';
import { extractState, generateJobSlug } from '../src/lib/states';
import { closeBrowser, createContext, createPage } from './browser';

const COMPANIES: CompanyConfig[] = [
  { id: 'constellation', name: 'Constellation Energy', careersUrl: 'https://jobs.constellationenergy.com/careers-home/', scraperType: 'custom' },
  { id: 'duke', name: 'Duke Energy', careersUrl: 'https://dukeenergy.wd1.myworkdayjobs.com/search', scraperType: 'workday' },
  { id: 'dominion', name: 'Dominion Energy', careersUrl: 'https://careers.dominionenergy.com/', scraperType: 'custom' },
  { id: 'entergy', name: 'Entergy', careersUrl: 'https://jobs.entergy.com/', scraperType: 'custom' },
  { id: 'nextera', name: 'NextEra Energy', careersUrl: 'https://www.nexteraenergy.com/careers/search-jobs.html', scraperType: 'custom' },
  { id: 'tva', name: 'Tennessee Valley Authority', careersUrl: 'https://www.tva.com/careers', scraperType: 'custom' },
];

interface EnrichedJob {
  id: string;
  company_id: string;
  title: string;
  location: string;
  url: string;
  scraped_at: string;
  slug: string;
  state: string | null;
  category: JobCategory;
  description?: string;
}

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

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.href.replace(/\/+$/, '');
  } catch {
    return url.replace(/\/+$/, '');
  }
}

async function fetchJobDescription(page: any, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await sleep(1500);

    const selectors = [
      '[data-automation-id="jobPostingDescription"]',
      '[data-automation-id="jobDescription"]',
      '.job-description',
      '.jobDescription',
      '#job-description',
      '[class*="job-description"]',
      '[class*="JobDescription"]',
      '[class*="description"]',
      'article',
    ];

    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.length > 200 && text.length < 15000) {
            const cleaned = text.trim().replace(/\s+/g, ' ');
            if (!cleaned.toLowerCase().includes('cookie policy') &&
                !cleaned.toLowerCase().includes('privacy notice')) {
              return cleaned.slice(0, 8000);
            }
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSingle(companyId: string): Promise<void> {
  const company = COMPANIES.find((c) => c.id === companyId);
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

    const jobsNeedingDescriptions = result.jobs.filter((j) => !j.description);
    if (jobsNeedingDescriptions.length > 0) {
      console.log(`Fetching descriptions for ${jobsNeedingDescriptions.length} jobs...`);
      const context = await createContext();
      const page = await createPage(context);

      for (const job of jobsNeedingDescriptions) {
        const description = await fetchJobDescription(page, job.url);
        if (description) {
          job.description = description;
        }
        await sleep(500);
      }

      await page.close();
      await context.close();
    }

    // Phase 3: Merge with existing jobs
    status.phase = 'Merging results';
    writeStatus(status);

    const existing: { jobs: EnrichedJob[] } = fs.existsSync(JOBS_PATH)
      ? JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'))
      : { jobs: [] };

    const otherCompanyJobs = existing.jobs.filter((j) => j.company_id !== companyId);
    const existingCompanyJobs = existing.jobs.filter((j) => j.company_id === companyId);

    // Build URL lookup from existing jobs for this company
    const existingByUrl = new Map<string, EnrichedJob>();
    for (const job of existingCompanyJobs) {
      existingByUrl.set(normalizeUrl(job.url), job);
    }

    // Find max ID across all existing jobs for new job IDs
    let maxId = existing.jobs.reduce((max, j) => {
      const n = parseInt(j.id, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);

    const now = new Date().toISOString();
    const mergedCompanyJobs: EnrichedJob[] = [];
    let newCount = 0;
    let updatedCount = 0;

    for (const scraped of result.jobs) {
      const normalizedUrl = normalizeUrl(scraped.url);
      const existing = existingByUrl.get(normalizedUrl);

      if (existing) {
        // Update existing job but preserve id, slug, category (manual edits)
        mergedCompanyJobs.push({
          ...existing,
          title: scraped.title,
          location: scraped.location,
          url: scraped.url,
          scraped_at: now,
          state: extractState(scraped.location),
          description: scraped.description || existing.description,
        });
        existingByUrl.delete(normalizedUrl);
        updatedCount++;
      } else {
        // New job
        const id = String(++maxId);
        mergedCompanyJobs.push({
          id,
          company_id: companyId,
          title: scraped.title,
          location: scraped.location,
          url: scraped.url,
          scraped_at: now,
          slug: generateJobSlug(scraped.title, scraped.location, id),
          state: extractState(scraped.location),
          category: categorizeJob(scraped.title),
          description: scraped.description,
        });
        newCount++;
      }
    }

    // Keep jobs that weren't found in this scrape (manual additions, temporarily missing)
    for (const leftover of existingByUrl.values()) {
      mergedCompanyJobs.push(leftover);
    }

    const allJobs = [...otherCompanyJobs, ...mergedCompanyJobs];
    fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs: allJobs }, null, 2) + '\n');

    // Update last_scraped in companies.json
    if (fs.existsSync(COMPANIES_PATH)) {
      const companiesData = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf-8'));
      const companyEntry = companiesData.companies.find(
        (c: { id: string }) => c.id === companyId
      );
      if (companyEntry) {
        companyEntry.last_scraped = now;
        fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companiesData, null, 2) + '\n');
      }
    }

    await closeBrowser();

    status.status = 'done';
    status.phase = 'Complete';
    status.newJobs = newCount;
    status.updatedJobs = updatedCount;
    status.completedAt = new Date().toISOString();
    writeStatus(status);

    console.log(`\nDone: ${newCount} new, ${updatedCount} updated, ${existingByUrl.size} kept`);
    console.log(`Total ${allJobs.length} jobs saved`);
  } catch (error) {
    await closeBrowser().catch(() => {});

    status.status = 'error';
    status.phase = 'Failed';
    status.error = error instanceof Error ? error.message : 'Unknown error';
    status.completedAt = new Date().toISOString();
    writeStatus(status);

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
