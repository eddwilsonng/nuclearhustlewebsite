import * as fs from 'fs';
import * as path from 'path';
import { createScraper } from './scrapers';
import { CompanyConfig, ScraperResult, ScrapedJob } from './types';
import { categorizeJob, JobCategory } from '../src/lib/categorize';
import { extractState, generateJobSlug } from '../src/lib/states';
import { closeBrowser, createContext, createPage } from './browser';

// Company configurations for initial 6 operators
const COMPANIES: CompanyConfig[] = [
  {
    id: 'constellation',
    name: 'Constellation Energy',
    careersUrl: 'https://jobs.constellationenergy.com/careers-home/',
    scraperType: 'custom',
  },
  {
    id: 'duke',
    name: 'Duke Energy',
    careersUrl: 'https://dukeenergy.wd1.myworkdayjobs.com/search',
    scraperType: 'workday',
  },
  {
    id: 'dominion',
    name: 'Dominion Energy',
    careersUrl: 'https://careers.dominionenergy.com/',
    scraperType: 'custom',
  },
  {
    id: 'entergy',
    name: 'Entergy',
    careersUrl: 'https://jobs.entergy.com/',
    scraperType: 'custom',
  },
  {
    id: 'nextera',
    name: 'NextEra Energy',
    careersUrl: 'https://www.nexteraenergy.com/careers/search-jobs.html',
    scraperType: 'custom',
  },
  {
    id: 'tva',
    name: 'Tennessee Valley Authority',
    careersUrl: 'https://www.tva.com/careers',
    scraperType: 'custom',
  },
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

async function fetchJobDescription(page: any, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await sleep(1500);

    // Try multiple selectors for job description
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
  } catch (error) {
    return null;
  }
}

async function runScrapers(): Promise<void> {
  console.log('Starting Nuclear Hustle job scraper...');
  console.log(`Scraping ${COMPANIES.length} companies\n`);

  const results: ScraperResult[] = [];
  const allJobs: EnrichedJob[] = [];

  const now = new Date().toISOString();
  let jobId = 1;

  // Phase 1: Scrape job listings from all companies
  console.log('=== Phase 1: Scraping job listings ===\n');

  for (const company of COMPANIES) {
    try {
      const scraper = createScraper(company);
      const result = await scraper.scrape();
      results.push(result);

      // Add jobs to the collection with enrichment
      for (const job of result.jobs) {
        const id = String(jobId++);
        const category = categorizeJob(job.title);
        const state = extractState(job.location);
        const slug = generateJobSlug(job.title, job.location, id);

        allJobs.push({
          id,
          company_id: company.id,
          title: job.title,
          location: job.location,
          url: job.url,
          scraped_at: now,
          slug,
          state,
          category,
          description: job.description,
        });
      }

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

  // Print Phase 1 summary
  console.log('\n--- Phase 1 Summary ---');
  for (const result of results) {
    const company = COMPANIES.find((c) => c.id === result.companyId);
    const status = result.success ? 'OK' : 'FAILED';
    console.log(`${company?.name}: ${result.jobs.length} jobs [${status}]${result.error ? ` - ${result.error}` : ''}`);
  }

  const totalJobs = results.reduce((sum, r) => sum + r.jobs.length, 0);
  const successCount = results.filter((r) => r.success).length;
  console.log(`\nTotal: ${totalJobs} jobs from ${successCount}/${results.length} companies`);

  // Phase 2: Fetch descriptions for jobs that don't have them
  console.log('\n=== Phase 2: Fetching job descriptions ===\n');

  const jobsNeedingDescriptions = allJobs.filter(j => !j.description);
  console.log(`Fetching descriptions for ${jobsNeedingDescriptions.length} jobs...\n`);

  if (jobsNeedingDescriptions.length > 0) {
    const context = await createContext();
    const page = await createPage(context);

    let fetched = 0;
    let failed = 0;

    for (const job of jobsNeedingDescriptions) {
      const description = await fetchJobDescription(page, job.url);
      if (description) {
        job.description = description;
        fetched++;
        console.log(`  ✓ ${job.title.slice(0, 50)}...`);
      } else {
        failed++;
        console.log(`  ✗ ${job.title.slice(0, 50)}...`);
      }

      // Rate limiting
      await sleep(500);
    }

    await page.close();
    await context.close();

    console.log(`\n--- Phase 2 Summary ---`);
    console.log(`Descriptions fetched: ${fetched}/${jobsNeedingDescriptions.length}`);
    console.log(`Failed: ${failed}`);
  }

  // Save jobs to JSON file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
  fs.writeFileSync(outputPath, JSON.stringify({ jobs: allJobs }, null, 2));
  console.log(`\nSaved ${allJobs.length} jobs to ${outputPath}`);

  // Clean up browser instance
  await closeBrowser();
  console.log('Browser closed.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run if executed directly
runScrapers().catch(console.error);
