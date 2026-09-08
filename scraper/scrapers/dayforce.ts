import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

/**
 * Dayforce Jobs portal (jobs.dayforcehcm.com/{locale}/{client}/CANDIDATEPORTAL).
 * Listings render in JS; we collect /jobs/{id} cards and paginate "Load more".
 */
export class DayforceScraper extends BrowserBaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name} (Dayforce)...`);
      await this.initBrowser();
      const page = this.page!;

      await this.navigateWithRetry(this.config.careersUrl);
      await this.randomDelay(2000, 3500);

      for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.randomDelay(800, 1400);
      }

      for (let i = 0; i < 12; i++) {
        const more = page
          .locator('button:has-text("Load more"), button:has-text("Show more"), a:has-text("Next")')
          .first();
        if ((await more.count()) === 0 || !(await more.isVisible().catch(() => false))) {
          break;
        }
        await more.click().catch(() => {});
        await this.randomDelay(1500, 2500);
      }

      const jobs = await page.$$eval('a[href*="/jobs/"]', (anchors) => {
        const seen = new Set<string>();
        const out: { title: string; url: string }[] = [];
        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (!/\/jobs\/\d+\/?$/.test(href) || seen.has(href)) continue;
          const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
          if (text.length < 5 || text.length > 140) continue;
          if (/^read more$/i.test(text) || /^skip /i.test(text)) continue;
          seen.add(href);
          out.push({ title: text, url: href });
        }
        return out;
      });

      await this.closeBrowser();
      console.log(`Found ${jobs.length} jobs from ${this.config.name}`);
      return this.createResult(
        jobs.map((j) => ({
          title: j.title,
          location: 'See posting for location',
          url: j.url,
        })),
      );
    } catch (error) {
      await this.closeBrowser();
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${this.config.name}: ${message}`);
      return this.createResult([], message);
    }
  }
}
