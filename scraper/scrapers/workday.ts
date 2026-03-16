import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

interface WorkdayJob {
  title: string;
  locationsText?: string;
  externalPath: string;
}

interface WorkdayResponse {
  jobPostings?: WorkdayJob[];
  total?: number;
}

// Workday job board scraper using network interception
// Works for: Duke Energy, Talen Energy, Energy Northwest, Ameren
export class WorkdayScraper extends BrowserBaseScraper {
  private interceptedJobs: WorkdayJob[] = [];

  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name} (Workday)...`);

      await this.initBrowser();
      const page = this.page!;

      // Set up network interception to capture job API responses
      this.interceptedJobs = [];

      await page.route('**/jobs**', async (route) => {
        const response = await route.fetch();
        const contentType = response.headers()['content-type'] || '';

        if (contentType.includes('application/json')) {
          try {
            const json = await response.json() as WorkdayResponse;
            if (json.jobPostings && Array.isArray(json.jobPostings)) {
              this.interceptedJobs.push(...json.jobPostings);
              console.log(`Intercepted ${json.jobPostings.length} jobs from API`);
            }
          } catch {
            // Not valid JSON, ignore
          }
        }

        await route.continue();
      });

      // Navigate to the Workday job search page
      await this.navigateWithRetry(this.config.careersUrl);
      await this.randomDelay(2000, 4000);

      // If we have a VISIBLE search box, search for nuclear jobs
      const searchSelectors = [
        'input[data-automation-id="searchBox"]:visible',
        'input[placeholder*="Search"]:visible',
        'input[type="search"]:visible'
      ];

      let searchFound = false;
      for (const selector of searchSelectors) {
        const searchInput = page.locator(selector);
        try {
          if (await searchInput.count() > 0 && await searchInput.first().isVisible()) {
            await searchInput.first().fill('nuclear', { timeout: 5000 });
            await page.keyboard.press('Enter');
            await this.randomDelay(3000, 5000);
            searchFound = true;
            break;
          }
        } catch {
          // Continue to next selector
        }
      }

      if (!searchFound) {
        console.log(`  No visible search input found for ${this.config.name}, using API interception`);
      }

      // Wait for job listings to load
      await page.waitForSelector('[data-automation-id="jobTitle"], .css-19uc56f, a[data-automation-id]', { timeout: 10000 }).catch(() => {});
      await this.randomDelay(1000, 2000);

      let jobs: ScrapedJob[] = [];

      // First, use intercepted API data if available (deduplicate first)
      if (this.interceptedJobs.length > 0) {
        const uniqueJobs = this.deduplicateInterceptedJobs(this.interceptedJobs);
        jobs = uniqueJobs.map((posting) => ({
          title: posting.title,
          location: posting.locationsText || 'Location not specified',
          url: this.buildJobUrl(posting.externalPath),
        }));
      }

      // Fallback: scrape from DOM if no API data intercepted
      if (jobs.length === 0) {
        jobs = await this.scrapeFromDOM();
      }

      await this.closeBrowser();

      // Filter for nuclear-related jobs if we didn't search
      const nuclearJobs = this.filterNuclearJobs(jobs);

      console.log(`Found ${nuclearJobs.length} jobs from ${this.config.name}`);
      return this.createResult(nuclearJobs);
    } catch (error) {
      await this.closeBrowser();
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${this.config.name}: ${message}`);
      return this.createResult([], message);
    }
  }

  private async scrapeFromDOM(): Promise<ScrapedJob[]> {
    const page = this.page!;
    const jobs: ScrapedJob[] = [];

    // Workday uses specific data-automation-id attributes
    const jobElements = await page.$$('[data-automation-id="jobTitle"], a[data-automation-id="jobTitle"]');

    for (const element of jobElements) {
      try {
        const title = await element.textContent();
        const href = await element.getAttribute('href');

        // Try to find location in parent/sibling elements
        const parent = await element.evaluateHandle((el) => el.closest('li, article, div[data-automation-id="compositeContainer"]'));
        let location = '';
        if (parent) {
          const locationEl = await (parent as any).$$('[data-automation-id="locations"], .css-129m7dg');
          if (locationEl.length > 0) {
            location = await locationEl[0].textContent() || '';
          }
        }

        if (title && title.trim()) {
          jobs.push({
            title: title.trim(),
            location: location?.trim() || 'See posting for location',
            url: href ? this.buildJobUrl(href) : this.config.careersUrl,
          });
        }
      } catch {
        // Skip this element on error
      }
    }

    // Alternative: try generic selectors
    if (jobs.length === 0) {
      const $ = await this.getPageContent();
      $('a[href*="/job/"]').each((_, element) => {
        const $el = $(element);
        const title = $el.text().trim();
        const href = $el.attr('href');

        if (title && title.length > 5 && title.length < 150) {
          jobs.push({
            title,
            location: 'See posting for location',
            url: href ? this.buildJobUrl(href) : this.config.careersUrl,
          });
        }
      });
    }

    return this.deduplicateJobs(jobs);
  }

  private buildJobUrl(path: string): string {
    if (path.startsWith('http')) return path;

    // Extract base domain from careers URL
    // e.g., https://dukeenergy.wd1.myworkdayjobs.com/search -> https://dukeenergy.wd1.myworkdayjobs.com
    const urlMatch = this.config.careersUrl.match(/(https:\/\/[^/]+)/);
    const baseDomain = urlMatch ? urlMatch[1] : this.config.careersUrl.replace('/search', '');

    // Workday paths from API typically start with /en-US/
    // If path doesn't include language prefix, add /en-US/search
    if (path.startsWith('/en-US/') || path.startsWith('/en/')) {
      return `${baseDomain}${path}`;
    }

    // Path likely is just the job portion like /job/Location/Title_ID
    // Construct full URL with /en-US/search prefix
    if (path.startsWith('/job/')) {
      return `${baseDomain}/en-US/search${path}`;
    }

    if (path.startsWith('/')) {
      return `${baseDomain}/en-US/search${path}`;
    }

    return `${baseDomain}/en-US/search/job/${path}`;
  }

  private filterNuclearJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    const nuclearKeywords = [
      'nuclear', 'reactor', 'radiation', 'health physics',
      'nrc', 'criticality', 'isotope', 'fission',
      'uranium', 'plutonium', 'fuel', 'core'
    ];

    // If already a small filtered set, return all
    if (jobs.length <= 50) return jobs;

    return jobs.filter((job) => {
      const title = job.title.toLowerCase();
      return nuclearKeywords.some((kw) => title.includes(kw));
    });
  }

  private deduplicateInterceptedJobs(jobs: WorkdayJob[]): WorkdayJob[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = job.externalPath;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = `${job.title}|${job.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
