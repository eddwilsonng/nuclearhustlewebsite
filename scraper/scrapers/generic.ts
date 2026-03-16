import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

// Generic browser-based scraper for custom job boards
// Works for: Dominion, Entergy, NextEra, and others
export class GenericBrowserScraper extends BrowserBaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name}...`);

      await this.initBrowser();
      const page = this.page!;

      // Navigate to careers page
      await this.navigateWithRetry(this.config.careersUrl);
      await this.randomDelay(2000, 4000);

      // Look for VISIBLE search functionality
      const searchSelectors = [
        'input[type="search"]:visible',
        'input[placeholder*="Search"]:visible',
        'input[name*="search"]:visible',
        'input[name*="keyword"]:visible',
        '#search:visible',
        '.search-input:visible'
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
        console.log(`  No visible search input found for ${this.config.name}, scraping page as-is`);
      }

      // Wait for any job listings to appear
      await page.waitForSelector('.job-listing, .job-item, .job-result, [data-job], a[href*="/job/"], .search-result', { timeout: 10000 }).catch(() => {});
      await this.randomDelay(1000, 2000);

      // Scrape jobs from the page
      const jobs = await this.scrapeJobListings();

      await this.closeBrowser();

      // Deduplicate by URL
      const uniqueJobs = this.deduplicateJobs(jobs);

      console.log(`Found ${uniqueJobs.length} jobs from ${this.config.name}`);
      return this.createResult(uniqueJobs);
    } catch (error) {
      await this.closeBrowser();
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${this.config.name}: ${message}`);
      return this.createResult([], message);
    }
  }

  private async scrapeJobListings(): Promise<ScrapedJob[]> {
    const $ = await this.getPageContent();
    const page = this.page!;
    const jobs: ScrapedJob[] = [];

    // Common CSS selectors for job listings across various sites
    const containerSelectors = [
      '.job-listing', '.job-item', '.job-result', '.career-item',
      '.position-item', '[data-job-id]', 'article.job', '.jobs-list li',
      '.job-card', 'tr.job-row', '.search-result', '.requisition',
      '[data-job]', 'li.job', '.searchResultItem'
    ];

    const titleSelectors = [
      '.job-title', '.title', 'h2', 'h3', 'h4',
      'a.job-link', '[class*="title"]', 'a'
    ];

    const locationSelectors = [
      '.location', '.job-location', '[class*="location"]',
      '.city', '.job-city', '[class*="city"]'
    ];

    // Try each container selector
    for (const containerSel of containerSelectors) {
      $(containerSel).each((_, element) => {
        const $el = $(element);

        let title = '';
        for (const titleSel of titleSelectors) {
          const found = $el.find(titleSel).first().text().trim();
          if (found && found.length > 3 && found.length < 150) {
            title = found;
            break;
          }
        }

        // If no title found in child elements, try the element itself
        if (!title) {
          const text = $el.find('a').first().text().trim();
          if (text && text.length > 3 && text.length < 150) {
            title = text;
          }
        }

        let location = '';
        for (const locSel of locationSelectors) {
          const found = $el.find(locSel).first().text().trim();
          if (found && found.length > 2) {
            location = found;
            break;
          }
        }

        const link = $el.find('a').first().attr('href') || $el.attr('href');

        if (title && link) {
          jobs.push({
            title,
            location: location || 'See posting for location',
            url: this.normalizeUrl(link),
          });
        }
      });

      if (jobs.length > 0) break;
    }

    // Fallback: look for any job-related links
    if (jobs.length === 0) {
      const excludePatterns = [
        'search', 'apply now', 'skip to', 'join our team', 'internship',
        'login', 'sign in', 'register', 'contact', 'about', 'privacy',
        'terms', 'cookie', 'help', 'faq', 'home', 'back', 'next', 'prev'
      ];

      const links = await page.$$eval('a', (anchors) =>
        anchors.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href
        })).filter(l => {
          if (!l.href || l.text.length <= 5 || l.text.length >= 150) return false;
          // Must have job-related path
          const hasJobPath = l.href.includes('/job/') ||
                            l.href.includes('/position/') ||
                            l.href.includes('/requisition') ||
                            (l.href.includes('/careers/') && l.href.match(/\/\d+\/?$/));
          return hasJobPath;
        })
      );

      for (const link of links) {
        const textLower = link.text.toLowerCase();
        const isExcluded = excludePatterns.some(p => textLower.includes(p));
        if (!isExcluded) {
          jobs.push({
            title: link.text,
            location: 'See posting for location',
            url: link.href,
          });
        }
      }
    }

    return jobs;
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    // Extract base domain from careers URL
    try {
      const baseUrl = new URL(this.config.careersUrl);
      if (url.startsWith('/')) {
        return `${baseUrl.origin}${url}`;
      }
      return `${baseUrl.origin}/${url}`;
    } catch {
      return url;
    }
  }

  private deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
    const seen = new Set<string>();
    return jobs.filter((job) => {
      const key = `${job.title}|${job.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Keep old class name for backwards compatibility
export const GenericScraper = GenericBrowserScraper;
