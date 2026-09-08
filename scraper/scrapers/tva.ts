import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';
import { fetchJobDescription } from '../enrich';

/**
 * TVA careers live on TalentSoft / TTC Portals (Cloudflare on curl, Playwright works).
 * https://tvacareers.ttcportals.com/jobs/search?q=nuclear
 */
export class TVAScraper extends BrowserBaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name} (TTC Portals)...`);
      await this.initBrowser();
      const page = this.page!;
      const kw = encodeURIComponent(this.config.searchKeyword ?? 'nuclear');
      const startUrl = `${this.config.careersUrl.replace(/\/$/, '')}?q=${kw}`;

      await this.navigateWithRetry(startUrl);
      await this.randomDelay(2500, 4000);

      const jobs: ScrapedJob[] = [];
      const seen = new Set<string>();

      for (let pageNo = 0; pageNo < 20; pageNo++) {
        const batch = await page.$$eval('a[href*="/jobs/"]', (anchors) =>
          anchors
            .map((a) => {
              const href = (a as HTMLAnchorElement).href;
              const title = (a.textContent || '').replace(/\s+/g, ' ').trim();
              return { href, title };
            })
            .filter(
              (l) =>
                /\/jobs\/\d+/.test(l.href) &&
                l.title.length > 5 &&
                l.title.length < 150 &&
                !/^view jobs$/i.test(l.title),
            ),
        );

        for (const row of batch) {
          if (seen.has(row.href)) continue;
          seen.add(row.href);
          jobs.push({
            title: row.title,
            location: 'Various TVA Locations',
            url: row.href,
          });
        }

        const next = page
          .locator('a[rel="next"], a:has-text("Next"), button:has-text("Next")')
          .first();
        if ((await next.count()) === 0 || !(await next.isVisible().catch(() => false))) {
          break;
        }
        await next.click();
        await this.randomDelay(2000, 3500);
      }

      for (const job of jobs) {
        const description = await fetchJobDescription(page, job.url);
        if (description) job.description = description;
        await this.randomDelay(800, 1400);
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
}
