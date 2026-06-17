import { BaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

/**
 * SAP SuccessFactors / jobs2web (Recruiting Marketing) career-site scraper.
 *
 * These sites server-render job tiles, so we parse HTML with Cheerio — no browser.
 * Two layouts are handled:
 *   - Classic career section: /search-results?keyword={kw}&startrow={n}
 *       <tr class="data-row"> a.jobTitle-link + span.jobLocation, 25/page
 *   - Career Site Builder:    /go/search/?q={kw}&startrow={n}
 *       <li> a[data-job-id] + sibling <span> location
 *
 * Descriptions are fetched later by the central enrichment step. A server-side
 * keyword filter (e.g. "nuclear") keeps mixed utilities from returning everything.
 *
 * Used by: Dominion, Entergy, APS, PG&E, PSEG, DTE.
 */
export class SuccessFactorsScraper extends BaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      const origin = new URL(this.config.careersUrl).origin;
      const kw = encodeURIComponent(this.config.searchKeyword ?? 'nuclear');
      console.log(`Scraping ${this.config.name} (SuccessFactors)...`);

      const csbBase = this.config.careersUrl.replace(/\/?$/, '');

      let buildUrl: (n: number) => string;
      let firstPage: ScrapedJob[];

      if (this.config.csbPathPagination) {
        // Path-offset CSB variant (e.g. Westinghouse: /go/All-Careers/8736400/25/)
        buildUrl = (n) => `${csbBase}${n > 0 ? '/' + n : ''}/`;
        firstPage = await this.parsePage(buildUrl(0), origin);
      } else {
        // Classic layout first, fall back to CSB search query-param layout.
        buildUrl = (n) => `${origin}/search-results?keyword=${kw}&startrow=${n}`;
        firstPage = await this.parsePage(buildUrl(0), origin);
        if (firstPage.length === 0) {
          buildUrl = (n) => `${origin}/go/search/?q=${kw}&startrow=${n}`;
          firstPage = await this.parsePage(buildUrl(0), origin);
        }
      }

      const seen = new Set<string>();
      const jobs: ScrapedJob[] = [];
      const add = (batch: ScrapedJob[]): number => {
        let added = 0;
        for (const j of batch) {
          if (seen.has(j.url)) continue;
          seen.add(j.url);
          jobs.push(j);
          added++;
        }
        return added;
      };

      add(firstPage);

      // Paginate by startrow (25/page) until a page yields no new jobs.
      const pageSize = 25;
      const maxPages = 20; // safety cap (~500 jobs)
      for (let page = 1; page < maxPages; page++) {
        const batch = await this.parsePage(buildUrl(page * pageSize), origin);
        if (batch.length === 0) break;
        const added = add(batch);
        if (added === 0) break; // only duplicates → end of results
        await this.sleep(400);
      }

      console.log(`Found ${jobs.length} jobs from ${this.config.name}`);
      return this.createResult(jobs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${this.config.name}: ${message}`);
      return this.createResult([], message);
    }
  }

  private async parsePage(url: string, origin: string): Promise<ScrapedJob[]> {
    let $;
    try {
      $ = await this.fetchHtml(url);
    } catch {
      return [];
    }

    const jobs: ScrapedJob[] = [];
    $('a[href*="/job/"]').each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      if (!href) return;

      const title = $a.text().replace(/\s+/g, ' ').trim();
      if (title.length < 4) return; // skip icon-only / empty anchors

      // Location lives in the row's .jobLocation span (classic) or a sibling
      // span (CSB). Avoid .colLocation — it can pick up the column header.
      const loc =
        $a.closest('tr').find('.jobLocation').first().text() ||
        $a.closest('li').find('span').first().text() ||
        '';

      jobs.push({
        title,
        location: cleanLocation(loc) || 'See posting for location',
        url: href.startsWith('http') ? href : `${origin}${href}`,
      });
    });

    return jobs;
  }
}

function cleanLocation(raw: string): string {
  const cleaned = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/,?\s*US\b/i, '')      // drop trailing country
    .replace(/,?\s*\d{5}(-\d{4})?$/, '') // drop trailing ZIP
    .replace(/,\s*$/, '')
    .trim();
  // Guard against stray column-header text leaking in as a "location".
  if (/^(title|location|date)$/i.test(cleaned)) return '';
  return cleaned;
}
