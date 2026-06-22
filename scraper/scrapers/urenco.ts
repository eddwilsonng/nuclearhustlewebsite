import { BaseScraper } from './base';
import { ScrapedJob, ScraperResult } from '../types';

interface UrencoJob {
  entry_id: number;
  job_title: string;
  job_country: string;
  job_location: string;
  job_type: string;
  job_hours: string;
  function: string;
  job_description: string;
  application_url: string;
  salary_currency: string;
  salary_from: string;
  salary_to: string;
  salary_per: string;
  hide_salary: number;
}

interface UrencoResponse {
  data: UrencoJob[];
  total: number;
}

/**
 * Urenco USA scraper — hits the public JSON API used by their vacancies SPA.
 * Filters to United States jobs only (they also post UK, Netherlands, Germany).
 * API discovered from https://vacancies.urenco.online/build/assets/app-*.js
 */
export class UrencoScraper extends BaseScraper {
  private readonly API_URL =
    'https://vacancies.urenco.online/api/vacancies/all?page=1&per_page=500';

  async scrape(): Promise<ScraperResult> {
    try {
      console.log(`Scraping ${this.config.name} (Urenco custom API)...`);

      const data = await this.fetchJson<UrencoResponse>(this.API_URL);
      const usJobs = (data.data || []).filter(
        (j) => j.job_country === 'United States'
      );

      const jobs: ScrapedJob[] = usJobs.map((j) => ({
        title: j.job_title?.trim() || 'Untitled',
        location: j.job_location?.trim() || 'Eunice, New Mexico',
        url: j.application_url || this.config.careersUrl,
        description: cleanDescription(j.job_description),
        department: j.function || undefined,
      }));

      console.log(
        `Found ${jobs.length} US jobs from ${this.config.name} (${data.total} total worldwide)`
      );
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
  const text = raw
    .replace(/<\/(p|div|li|h[1-6]|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length < 50) return undefined;
  return text.slice(0, 8000);
}
