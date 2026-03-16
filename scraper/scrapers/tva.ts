import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

// Tennessee Valley Authority job board scraper
// TVA uses Oracle/Taleo system which requires JavaScript to render
export class TVAScraper extends BrowserBaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name}...`);

      await this.initBrowser();

      // TVA main careers page links to their job search portal
      // Navigate to find-a-job page first
      await this.navigateWithRetry('https://www.tva.com/careers/find-a-job');

      // Check if there's a redirect link to an external job portal
      const page = this.page!;

      // Look for external job portal links (Taleo, Workday, etc.)
      const externalLinks = await page.$$eval('a[href*="jobs"], a[href*="careers"], a[href*="taleo"], iframe[src*="jobs"]',
        (elements) => elements.map(el => {
          if (el.tagName === 'IFRAME') {
            return (el as HTMLIFrameElement).src;
          }
          return (el as HTMLAnchorElement).href;
        }).filter(href => href && (href.includes('taleo') || href.includes('jobs.tva') || href.includes('recruiting')))
      );

      let jobs: ScrapedJob[] = [];

      // If we found an external portal link, navigate there
      if (externalLinks.length > 0) {
        const jobPortalUrl = externalLinks[0];
        console.log(`TVA redirects to: ${jobPortalUrl}`);

        try {
          await this.navigateWithRetry(jobPortalUrl);
          await this.randomDelay(2000, 4000);

          jobs = await this.scrapeJobListings();
        } catch (err) {
          console.log(`Could not access external portal: ${err}`);
        }
      }

      // If no jobs found, try to scrape from current page
      if (jobs.length === 0) {
        jobs = await this.scrapeJobListings();
      }

      // Search for nuclear-related jobs if we have a VISIBLE search functionality
      if (jobs.length === 0) {
        const searchSelectors = [
          'input[type="search"]:visible',
          'input[placeholder*="search"]:visible',
          'input[name*="search"]:visible',
          '#search:visible',
          '.search-input:visible'
        ];

        for (const selector of searchSelectors) {
          const searchInput = page.locator(selector);
          try {
            if (await searchInput.count() > 0 && await searchInput.first().isVisible()) {
              await searchInput.first().fill('nuclear', { timeout: 5000 });
              await page.keyboard.press('Enter');
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
    const jobs: ScrapedJob[] = [];
    const page = this.page!;

    // Try multiple selector patterns common in job boards
    const selectors = [
      '.job-listing', '.job-item', '.job-result', '.job-row',
      '[data-job]', '[data-job-id]', '.requisition', '.job-card',
      'tr.data-row', 'li.job', 'article.job', '.searchResultItem',
      '.job-search-result', '.career-item', '.position-item'
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
            location: location || 'Various TVA Locations',
            url: link ? this.normalizeUrl(link, page.url()) : this.config.careersUrl,
          });
        }
      });

      if (jobs.length > 0) break;
    }

    // If no jobs found with selectors, look for any job-related links
    if (jobs.length === 0) {
      const links = await page.$$eval('a', (anchors) =>
        anchors.map(a => ({
          text: a.textContent?.trim() || '',
          href: a.href
        })).filter(l =>
          l.href &&
          l.text.length > 5 &&
          l.text.length < 150 &&
          (l.href.includes('/job/') || l.href.includes('/position/') || l.href.includes('requisition'))
        )
      );

      for (const link of links) {
        jobs.push({
          title: link.text,
          location: 'Various TVA Locations',
          url: link.href,
        });
      }
    }

    return this.deduplicateJobs(jobs);
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    try {
      const base = new URL(baseUrl);
      if (url.startsWith('/')) {
        return `${base.origin}${url}`;
      }
      return `${base.origin}/${url}`;
    } catch {
      return url;
    }
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
