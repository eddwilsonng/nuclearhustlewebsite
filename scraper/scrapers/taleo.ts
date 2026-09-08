import { BrowserBaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

/**
 * Oracle Taleo careersection boards (e.g. Evergy / Wolf Creek).
 * Types "nuclear" into the visible keyword box and reads requisition rows.
 */
export class TaleoScraper extends BrowserBaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name} (Taleo)...`);
      await this.initBrowser();
      const page = this.page!;

      await this.navigateWithRetry(this.config.careersUrl);
      await this.randomDelay(2000, 4000);

      const keyword = page.locator('#basicSearchInterface\\.keywordInput');
      if (await keyword.count()) {
        await keyword.fill(this.config.searchKeyword ?? 'nuclear', { timeout: 8000 });
        const searchBtn = page.locator(
          '#basicSearchFooterInterface\\.searchAction, input[value="Search"], button:has-text("Search")',
        ).first();
        if (await searchBtn.count()) {
          await searchBtn.click();
        } else {
          await page.keyboard.press('Enter');
        }
        await this.randomDelay(3000, 5000);
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      }

      const jobs: ScrapedJob[] = [];
      const seen = new Set<string>();

      for (let pageNo = 0; pageNo < 15; pageNo++) {
        const rows = await page.$$eval(
          'a[id*="requisitionListInterface.reqTitleLinkAction"]',
          (anchors) =>
            anchors.map((a) => ({
              title: (a.textContent || '').replace(/\s+/g, ' ').trim(),
              url: (a as HTMLAnchorElement).href,
            })),
        );

        for (const row of rows) {
          if (!row.title || !row.url || seen.has(row.url)) continue;
          seen.add(row.url);
          jobs.push({
            title: row.title,
            location: 'See posting for location',
            url: row.url,
          });
        }

        const next = page.locator(
          'a[id*="pagerPanelNextButton"], a[id*=".Next"], a[title="Go to the next page"]',
        ).first();
        if ((await next.count()) === 0) break;
        const visible = await next.isVisible().catch(() => false);
        const enabled = await next.isEnabled().catch(() => false);
        const disabled = (await next.getAttribute('aria-disabled')) === 'true';
        if (!visible || !enabled || disabled) break;
        await next.click({ timeout: 5000 });
        await this.randomDelay(2000, 3500);
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
