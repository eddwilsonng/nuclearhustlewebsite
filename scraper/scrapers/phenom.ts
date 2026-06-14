import { BaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

interface PhenomJobData {
  req_id?: string;
  slug?: string;
  title?: string;
  description?: string;
  responsibilities?: string;
  qualifications?: string;
  full_location?: string;
  short_location?: string;
  city?: string;
  state?: string;
  categories?: string[];
  category?: string[] | string;
}

interface PhenomResponse {
  jobs?: { data: PhenomJobData }[];
  totalCount?: number;
}

/**
 * Phenom People career-site scraper using the public `/api/jobs` endpoint.
 * Returns structured JSON with full descriptions — no browser needed.
 *
 * Endpoint: {origin}/api/jobs?keywords={kw}&page={n}  (10 results/page)
 * Used by Constellation Energy (jobs.constellationenergy.com).
 */
export class PhenomScraper extends BaseScraper {
  async scrape(): Promise<ScraperResult> {
    try {
      const origin = new URL(this.config.careersUrl).origin;
      const kw = this.config.searchKeyword ? encodeURIComponent(this.config.searchKeyword) : '';
      console.log(`Scraping ${this.config.name} (Phenom${kw ? `: "${this.config.searchKeyword}"` : ''})...`);

      const jobs: ScrapedJob[] = [];
      let total = Infinity;
      const maxPages = 60;

      for (let page = 1; page <= maxPages; page++) {
        const url = `${origin}/api/jobs?keywords=${kw}&page=${page}`;
        const data = await this.fetchJson<PhenomResponse>(url);
        if (typeof data.totalCount === 'number') total = data.totalCount;

        const batch = data.jobs || [];
        if (batch.length === 0) break;

        for (const { data: d } of batch) {
          jobs.push({
            title: (d.title || 'Untitled').trim(),
            location: d.full_location || locationFrom(d) || 'Location not specified',
            url: `${origin}/careers-home/jobs/${d.req_id || d.slug}`,
            description: buildDescription(d),
            department: departmentFrom(d),
          });
        }

        if (jobs.length >= total) break;
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
}

function locationFrom(d: PhenomJobData): string | undefined {
  if (d.short_location) return d.short_location;
  if (d.city && d.state) return `${d.city}, ${d.state}`;
  return d.city || undefined;
}

function departmentFrom(d: PhenomJobData): string | undefined {
  const raw = d.categories || (Array.isArray(d.category) ? d.category : d.category ? [d.category] : []);
  const joined = (raw as unknown[])
    .map((c) => {
      if (typeof c === 'string') return c.trim();
      if (c && typeof c === 'object') {
        const v = (c as Record<string, unknown>).name ?? (c as Record<string, unknown>).label;
        return typeof v === 'string' ? v.trim() : '';
      }
      return '';
    })
    .filter(Boolean)
    .join(', ');
  return joined || undefined;
}

function buildDescription(d: PhenomJobData): string | undefined {
  const parts = [d.description, d.responsibilities, d.qualifications]
    .map((p) => stripHtml(p))
    .filter((p): p is string => !!p);
  if (parts.length === 0) return undefined;
  return parts.join('\n\n').slice(0, 8000);
}

function stripHtml(raw?: string): string | undefined {
  if (!raw) return undefined;
  const text = raw
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > 20 ? text : undefined;
}

function dedupe(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    if (seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });
}
