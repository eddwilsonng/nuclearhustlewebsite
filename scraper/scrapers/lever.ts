import { BaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';
import type { Salary } from '../../src/lib/types';

interface LeverPosting {
  text: string;
  hostedUrl: string;
  descriptionPlain?: string;
  categories?: {
    location?: string;
    team?: string;
    department?: string;
    commitment?: string;
  };
  // Lever's structured comp field, present when the employer fills it in.
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string; // e.g. "per-year-salary", "per-hour-wage"
  };
}

// Map Lever's interval enum onto our period; null for unsupported intervals
// (per-week/per-day/one-time) so we don't emit a misleading annual/hourly value.
function leverSalary(range?: LeverPosting['salaryRange']): Salary | null {
  if (!range || (range.min == null && range.max == null)) return null;
  const interval = range.interval ?? '';
  const period = /hour/.test(interval) ? 'hour' : /year/.test(interval) ? 'year' : null;
  if (!period) return null;
  return {
    min: range.min ?? range.max ?? null,
    max: range.max ?? range.min ?? null,
    period,
    source: 'structured',
  };
}

/**
 * Lever job board scraper using the public postings API.
 * No browser needed — returns structured JSON with plain-text descriptions.
 * Endpoint: https://api.lever.co/v0/postings/{handle}?mode=json
 *
 * Used by several advanced-reactor startups (e.g. Oklo, X-energy).
 */
export class LeverScraper extends BaseScraper {
  async scrape(): Promise<ScraperResult> {
    const handle = this.config.atsSlug;
    if (!handle) {
      return this.createResult([], 'Lever scraper requires atsSlug (company handle)');
    }

    try {
      console.log(`Scraping ${this.config.name} (Lever: ${handle})...`);
      const url = `https://api.lever.co/v0/postings/${handle}?mode=json`;
      const data = await this.fetchJson<LeverPosting[]>(url);

      const jobs: ScrapedJob[] = (data || []).map((p) => ({
        title: p.text?.trim() || 'Untitled',
        location: p.categories?.location?.trim() || 'Location not specified',
        url: p.hostedUrl,
        description: cleanDescription(p.descriptionPlain),
        department: p.categories?.department || p.categories?.team || undefined,
        salary: leverSalary(p.salaryRange),
      }));

      console.log(`Found ${jobs.length} jobs from ${this.config.name}`);
      return this.createResult(jobs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error scraping ${this.config.name}: ${message}`);
      return this.createResult([], message);
    }
  }
}

function cleanDescription(raw?: string): string | undefined {
  if (!raw) return undefined;
  const text = raw.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 50) return undefined;
  return text.slice(0, 8000);
}
