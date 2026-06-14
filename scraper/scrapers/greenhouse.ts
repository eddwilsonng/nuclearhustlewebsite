import { BaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

interface GreenhouseJob {
  title: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
  departments?: { name?: string }[];
  offices?: { name?: string }[];
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
}

/**
 * Greenhouse job board scraper using the public boards API.
 * No browser needed — returns structured JSON with full descriptions.
 * Endpoint: https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 *
 * Used by many advanced-reactor startups (e.g. NuScale, TerraPower, Kairos).
 */
export class GreenhouseScraper extends BaseScraper {
  async scrape(): Promise<ScraperResult> {
    const token = this.config.atsSlug;
    if (!token) {
      return this.createResult([], 'Greenhouse scraper requires atsSlug (board token)');
    }

    try {
      console.log(`Scraping ${this.config.name} (Greenhouse: ${token})...`);
      const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
      const data = await this.fetchJson<GreenhouseResponse>(url);

      const jobs: ScrapedJob[] = (data.jobs || []).map((j) => ({
        title: j.title?.trim() || 'Untitled',
        location: j.location?.name?.trim() || j.offices?.[0]?.name?.trim() || 'Location not specified',
        url: j.absolute_url,
        description: cleanHtml(j.content),
        department: j.departments?.map((d) => d.name).filter(Boolean).join(', ') || undefined,
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

// Greenhouse returns HTML-encoded content; decode entities and strip tags to plain text.
function cleanHtml(raw?: string): string | undefined {
  if (!raw) return undefined;
  const decoded = raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  const text = decoded
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, '\n')
    .replace(/<br\s*\/?>(?=)/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length < 50) return undefined;
  return text.slice(0, 8000);
}
