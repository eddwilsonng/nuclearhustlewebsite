import type { Page } from 'playwright';
import { categorizeJob, JobCategory } from '../src/lib/categorize';
import { extractState, generateJobSlug } from '../src/lib/states';
import { scoreNuclearRelevance } from './relevance';
import { ScrapedJob } from './types';
import { parseSalary } from './parseSalary';
import type { Salary } from '../src/lib/types';

export interface StructuredDescription {
  about?: string;
  responsibilities?: string;
  qualifications?: string;
  desired?: string;
  location_details?: string;
}

export interface EnrichedJob {
  id: string;
  company_id: string;
  title: string;
  location: string;
  url: string;
  scraped_at: string;
  slug: string;
  state: string | null;
  category: JobCategory;
  description?: string;
  department?: string;
  // Review-pipeline fields (preserved across re-scrapes).
  status?: 'pending_review' | 'published' | 'rejected';
  agent_confidence?: 'high' | 'low';
  review_notes?: string;
  structured_description?: StructuredDescription | null;
  salary?: Salary | null;
}

// Resolve a job's salary: trust a structured ATS value, else parse the
// description, else keep whatever we had on a prior scrape.
function resolveSalary(job: ScrapedJob, existing?: EnrichedJob): Salary | null {
  return job.salary ?? parseSalary(job.description) ?? existing?.salary ?? null;
}

export interface MergeStats {
  new: number;
  updated: number;
  kept: number;
  dropped: number;
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    return u.href.replace(/\/+$/, '');
  } catch {
    return url.replace(/\/+$/, '');
  }
}

/**
 * Merge one company's freshly scraped jobs into the full existing inventory.
 *
 * Guarantees:
 *  - Existing jobs (matched by normalized URL) keep their id, slug, category, and
 *    all review-pipeline fields (status, structured_description, review_notes,
 *    agent_confidence). Only volatile fields are refreshed.
 *  - New jobs are run through the nuclear-relevance filter. Irrelevant ones are
 *    dropped; relevant ones are added as `pending_review` with the filter's
 *    confidence/reason so they surface in /dashboard/admin/review.
 *  - Existing jobs not seen in this scrape are kept (temporarily missing /
 *    manually curated), never silently deleted.
 */
export function mergeCompanyJobs(
  existingAll: EnrichedJob[],
  companyId: string,
  scraped: ScrapedJob[],
  now: string
): { jobs: EnrichedJob[]; stats: MergeStats } {
  const otherCompanyJobs = existingAll.filter((j) => j.company_id !== companyId);
  const existingCompanyJobs = existingAll.filter((j) => j.company_id === companyId);

  const existingByUrl = new Map<string, EnrichedJob>();
  for (const job of existingCompanyJobs) {
    existingByUrl.set(normalizeUrl(job.url), job);
  }

  let maxId = existingAll.reduce((max, j) => {
    const n = parseInt(j.id, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);

  const merged: EnrichedJob[] = [];
  const stats: MergeStats = { new: 0, updated: 0, kept: 0, dropped: 0 };

  for (const job of scraped) {
    const key = normalizeUrl(job.url);
    const existing = existingByUrl.get(key);

    if (existing) {
      // Refresh volatile fields, preserve identity + review state.
      merged.push({
        ...existing,
        title: job.title,
        location: job.location,
        url: job.url,
        scraped_at: now,
        state: extractState(job.location),
        description: job.description || existing.description,
        department: job.department || existing.department,
        salary: resolveSalary(job, existing),
      });
      existingByUrl.delete(key);
      stats.updated++;
      continue;
    }

    // New job — apply relevance filter.
    const verdict = scoreNuclearRelevance({
      title: job.title,
      description: job.description,
      department: job.department,
      location: job.location,
      companyId,
    });
    if (!verdict.keep) {
      stats.dropped++;
      continue;
    }

    const id = String(++maxId);
    merged.push({
      id,
      company_id: companyId,
      title: job.title,
      location: job.location,
      url: job.url,
      scraped_at: now,
      slug: generateJobSlug(job.title, job.location, id),
      state: extractState(job.location),
      category: categorizeJob(job.title),
      description: job.description,
      department: job.department,
      salary: resolveSalary(job),
      status: 'pending_review',
      agent_confidence: verdict.confidence,
      review_notes: verdict.reason,
    });
    stats.new++;
  }

  // Keep jobs not seen this run.
  for (const leftover of existingByUrl.values()) {
    merged.push(leftover);
    stats.kept++;
  }

  return { jobs: [...otherCompanyJobs, ...merged], stats };
}

const DESCRIPTION_SELECTORS = [
  '[data-automation-id="jobPostingDescription"]',
  '[data-automation-id="jobDescription"]',
  '.job-description',
  '.jobDescription',
  '#job-description',
  '[class*="job-description"]',
  '[class*="JobDescription"]',
  '[class*="description"]',
  'article',
];

// Fetch a job description from a detail page (used for sources that don't include it inline).
export async function fetchJobDescription(page: Page, url: string): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    for (const selector of DESCRIPTION_SELECTORS) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.length > 200 && text.length < 15000) {
            const cleaned = text.trim().replace(/\s+/g, ' ');
            if (
              !cleaned.toLowerCase().includes('cookie policy') &&
              !cleaned.toLowerCase().includes('privacy notice')
            ) {
              return cleaned.slice(0, 8000);
            }
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}
