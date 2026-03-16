import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

// Constellation Energy job board scraper
// Uses browser-based scraping as the site renders jobs dynamically
export class ConstellationScraper extends BrowserBaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name}...`);

      await this.initBrowser();
      const page = this.page!;

      // Navigate to Constellation careers page
      await this.navigateWithRetry(this.config.careersUrl);
      await this.randomDelay(2000, 4000);

      // Look for VISIBLE search functionality
      const searchSelectors = [
        'input[type="search"]:visible',
        'input[placeholder*="Search"]:visible',
        'input[name*="search"]:visible',
        '#keyword-search:visible',
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

      // Wait for job listings to appear
      await page.waitForSelector('.job-listing, .job-item, .job-result, [data-job], a[href*="/job/"]', { timeout: 10000 }).catch(() => {});
      await this.randomDelay(1000, 2000);

      // Scrape jobs from the page
      let jobs = await this.scrapeJobListings();

      // If no jobs found on main page, look for a VISIBLE "View All Jobs" link
      if (jobs.length === 0) {
        const viewAllSelectors = [
          'a:has-text("View All"):visible',
          'a:has-text("All Jobs"):visible',
          'a:has-text("Search Jobs"):visible',
          'a[href*="/jobs"]:visible',
          'a[href*="/search"]:visible'
        ];

        for (const selector of viewAllSelectors) {
          const viewAllLink = page.locator(selector);
          try {
            if (await viewAllLink.count() > 0 && await viewAllLink.first().isVisible()) {
              await viewAllLink.first().click({ timeout: 10000 });
              await this.randomDelay(3000, 5000);
              jobs = await this.scrapeJobListings();
              break;
            }
          } catch {
            // Continue to next selector
          }
        }
      }

      await this.closeBrowser();

      console.log(`Found ${jobs.length} jobs from ${this.config.name}`);
      return this.createResult(jobs);
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

    // Common job listing selectors
    const selectors = [
      '.job-listing', '.job-item', '.job-result', '.job-row',
      '[data-job]', '[data-job-id]', '.requisition', '.job-card',
      'li.job', 'article.job', '.searchResultItem', '.career-item'
    ];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const $el = $(element);
        const title = $el.find('a, h2, h3, h4, .title, .job-title').first().text().trim();
        const location = $el.find('.location, [class*="location"], .job-location').first().text().trim();
        const link = $el.find('a').first().attr('href');

        if (title && title.length > 3 && title.length < 200) {
          jobs.push({
            title,
            location: location || 'See posting',
            url: link ? this.normalizeUrl(link) : this.config.careersUrl,
          });
        }
      });

      if (jobs.length > 0) break;
    }

    // Fallback: look for links containing job-related paths
    if (jobs.length === 0) {
      const links = await page.$$eval('a', (anchors) =>
        anchors.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href
        })).filter(l =>
          l.href &&
          l.text.length > 5 &&
          l.text.length < 150 &&
          !l.text.includes('Search') &&
          !l.text.includes('Apply') &&
          (l.href.includes('/job/') || l.href.includes('/position/') || l.href.includes('/careers/'))
        )
      );

      for (const link of links) {
        jobs.push({
          title: link.text,
          location: 'See posting',
          url: link.href,
        });
      }
    }

    return this.deduplicateJobs(jobs);
  }

  private normalizeUrl(url: string): string {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) {
      return `https://jobs.constellationenergy.com${url}`;
    }
    return `https://jobs.constellationenergy.com/${url}`;
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
