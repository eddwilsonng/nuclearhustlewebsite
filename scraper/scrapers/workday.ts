import axios from 'axios';
import { BaseScraper } from './base';
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

/**
 * Workday scraper using the public CXS JSON API — no browser required.
 *
 * Endpoint: POST https://{host}/wday/cxs/{tenant}/{site}/jobs
 *   body: { appliedFacets: {}, limit, offset, searchText }
 *   → { total, jobPostings: [{ title, locationsText, externalPath }] }
 *
 * `tenant` is the first label of the Workday host; `site` is the last path
 * segment of careersUrl (e.g. dukeenergy.wd1.myworkdayjobs.com/search → "search").
 * Public job URL is {origin}/{site}{externalPath}. Each posting then hits the
 * CXS detail endpoint so we keep the jobDescription instead of a title stub.
 *
 * Used by: Duke Energy, Ameren, Energy Northwest, Talen Energy.
 */
export class WorkdayScraper extends BaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      const { host, tenant, site } = this.resolveTenant();
      const endpoint = `https://${host}/wday/cxs/${tenant}/${site}/jobs`;
      const origin = `https://${host}`;
      const searchText = this.config.searchKeyword ?? 'nuclear';
      console.log(`Scraping ${this.config.name} (Workday API: "${searchText}")...`);

      const jobs: ScrapedJob[] = [];
      const limit = 20;
      const maxPages = 50; // safety cap (1000 jobs)
      let total = Infinity;

      for (let page = 0; page < maxPages; page++) {
        const offset = page * limit;
        const data = await this.postJson<WorkdayResponse>(endpoint, {
          appliedFacets: {},
          limit,
          offset,
          searchText,
        });

        if (typeof data.total === 'number') total = data.total;
        const batch = data.jobPostings ?? [];
        if (batch.length === 0) break;

        for (const posting of batch) {
          const path = posting.externalPath;
          let description: string | undefined;
          try {
            const detail = await this.fetchJson<{
              jobPostingInfo?: { jobDescription?: string; location?: string };
            }>(`https://${host}/wday/cxs/${tenant}/${site}${path}`);
            const html = detail.jobPostingInfo?.jobDescription || '';
            const text = html
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/\s+/g, ' ')
              .trim();
            if (text.length >= 80) description = text.slice(0, 8000);
          } catch {
            // listing still useful without body
          }

          jobs.push({
            title: (posting.title || 'Untitled').trim(),
            location: posting.locationsText?.trim() || 'Location not specified',
            url: `${origin}/${site}${path}`,
            description,
          });
        }

        if (offset + limit >= total) break;
        await this.sleep(400);
      }

      console.log(`Found ${jobs.length} jobs from ${this.config.name}`);
      return this.createResult(dedupe(jobs));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${this.config.name}: ${message}`);
      return this.createResult([], message);
    }
  }

  /** Derive {host, tenant, site} from workdayHost + careersUrl. */
  private resolveTenant(): { host: string; tenant: string; site: string } {
    const url = new URL(this.config.careersUrl);
    const host = this.config.workdayHost ?? url.host;
    const tenant = host.split('.')[0];
    const site = url.pathname.split('/').filter(Boolean).pop() ?? 'External';
    return { host, tenant, site };
  }

  private async postJson<T>(url: string, body: unknown): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const res = await axios.post<T>(url, body, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 30000,
        });
        return res.data;
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry ${i + 1}/${this.maxRetries} for ${url}: ${lastError.message}`);
        await this.sleep(this.retryDelay);
      }
    }
    throw lastError || new Error('Failed to fetch Workday API');
  }
}

function dedupe(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    if (seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });
}
