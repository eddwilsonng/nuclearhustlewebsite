import type { Page } from "playwright";
import axios from "axios";
import * as cheerio from "cheerio";
import { categorizeJob, JobCategory } from "../src/lib/categorize";
import { extractState, generateJobSlug } from "../src/lib/states";
import { scoreNuclearRelevance } from "./relevance";
import { ScrapedJob } from "./types";
import { parseSalary } from "./parseSalary";
import type { Salary, StructuredDescription } from "../src/lib/types";

export type { StructuredDescription };

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
  status?: "pending_review" | "published" | "rejected" | "expired";
  agent_confidence?: "high" | "low";
  review_notes?: string;
  structured_description?: StructuredDescription | null;
  skills?: string[];
  salary?: Salary | null;
  // Hygiene lifecycle. last_seen_at is refreshed whenever the job's URL is
  // returned by a scrape; link_check_failures is the consecutive dead-probe
  // count (reset to 0 when seen alive); see scraper/hygiene.ts.
  last_seen_at?: string;
  last_checked_at?: string;
  link_check_failures?: number;
  expired_at?: string;
  pre_expiry_status?: "published" | "pending_review";
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
    u.search = "";
    u.hash = "";
    return u.href.replace(/\/+$/, "");
  } catch {
    return url.replace(/\/+$/, "");
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
  now: string,
): { jobs: EnrichedJob[]; stats: MergeStats; added: EnrichedJob[] } {
  const otherCompanyJobs = existingAll.filter(
    (j) => j.company_id !== companyId,
  );
  const existingCompanyJobs = existingAll.filter(
    (j) => j.company_id === companyId,
  );

  const existingByUrl = new Map<string, EnrichedJob>();
  for (const job of existingCompanyJobs) {
    existingByUrl.set(normalizeUrl(job.url), job);
  }

  let maxId = existingAll.reduce((max, j) => {
    const n = parseInt(j.id, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);

  const merged: EnrichedJob[] = [];
  const added: EnrichedJob[] = [];
  const stats: MergeStats = { new: 0, updated: 0, kept: 0, dropped: 0 };

  for (const job of scraped) {
    const key = normalizeUrl(job.url);
    const existing = existingByUrl.get(key);

    if (existing) {
      // Seen at source this run: it's alive. Refresh volatile fields, preserve
      // identity + review state, and reset the hygiene counters.
      const wasExpired = existing.status === "expired";
      merged.push({
        ...existing,
        title: job.title,
        location: job.location,
        url: job.url,
        scraped_at: now,
        last_seen_at: now,
        link_check_failures: 0,
        state: extractState(job.location),
        description: job.description || existing.description,
        department: job.department || existing.department,
        salary: resolveSalary(job, existing),
        // Revive a previously-expired job that has re-appeared at its source.
        ...(wasExpired
          ? {
              status: existing.pre_expiry_status ?? "published",
              expired_at: undefined,
              pre_expiry_status: undefined,
            }
          : {}),
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
    const created: EnrichedJob = {
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
      status: "pending_review",
      agent_confidence: verdict.confidence,
      review_notes: verdict.reason,
      last_seen_at: now,
      link_check_failures: 0,
    };
    merged.push(created);
    added.push(created);
    stats.new++;
  }

  // Keep jobs not seen this run.
  for (const leftover of existingByUrl.values()) {
    merged.push(leftover);
    stats.kept++;
  }

  return { jobs: [...otherCompanyJobs, ...merged], stats, added };
}

const DESCRIPTION_SELECTORS = [
  '[data-automation-id="jobPostingDescription"]',
  '[data-automation-id="jobDescription"]',
  ".job-description",
  ".jobDescription",
  "#job-description",
  '[class*="job-description"]',
  '[class*="JobDescription"]',
  '[class*="description"]',
  "article",
];

function cleanDescription(raw: string): string | null {
  const cleaned = raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 80 || cleaned.length > 20000) return null;
  const lower = cleaned.toLowerCase();
  // Real JDs often include an EEO "privacy notice" footer. Only drop short
  // cookie-wall / expired stubs.
  if (cleaned.length < 400 && (lower.includes("cookie policy") || lower.includes("privacy notice"))) {
    return null;
  }
  if (/job posting has expired|no longer posted/i.test(cleaned)) return null;
  return cleaned.slice(0, 8000);
}

const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Workday public job URL → CXS detail JSON. */
export function workdayCxsUrl(jobUrl: string): string | null {
  try {
    const u = new URL(jobUrl);
    if (!u.hostname.includes("myworkdayjobs.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const tenant = u.hostname.split(".")[0];
    const site = parts[0];
    const rest = parts.slice(1).join("/");
    return `${u.origin}/wday/cxs/${tenant}/${site}/${rest}`;
  } catch {
    return null;
  }
}

function descriptionFromHtml(html: string): string | null {
  const $ = cheerio.load(html);
  const jsonld: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    jsonld.push($(el).contents().text());
  });
  for (const raw of jsonld) {
    const fromLd = jsonLdJobDescription(raw);
    if (fromLd) return fromLd;
  }

  const sf = $('[itemprop="description"], .jobdescription, .job-description').first();
  if (sf.length) {
    const inner = sf.html() || sf.text();
    const cleaned = cleanDescription(inner);
    if (cleaned && !/^tbd$/i.test(cleaned)) return cleaned;
  }
  return null;
}

/**
 * Pull a job body without Playwright. Workday CXS JSON, then SuccessFactors /
 * JSON-LD HTML. Returns null for JS-only boards (Southern NLX, TVA TTC, Taleo).
 */
export async function fetchJobDescriptionHttp(url: string): Promise<string | null> {
  const cxs = workdayCxsUrl(url);
  if (cxs) {
    try {
      const res = await axios.get<{
        jobPostingInfo?: { jobDescription?: string };
      }>(cxs, {
        headers: { ...HTTP_HEADERS, Accept: "application/json" },
        timeout: 20000,
      });
      const html = res.data?.jobPostingInfo?.jobDescription || "";
      return cleanDescription(html);
    } catch {
      return null;
    }
  }

  try {
    const res = await axios.get<string>(url, {
      headers: { ...HTTP_HEADERS, Accept: "text/html,application/xhtml+xml" },
      timeout: 20000,
      maxRedirects: 5,
    });
    return descriptionFromHtml(typeof res.data === "string" ? res.data : "");
  } catch {
    return null;
  }
}

function jsonLdJobDescription(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const obj = node as { "@type"?: string; description?: string };
      const type = obj["@type"];
      const isPosting =
        type === "JobPosting" ||
        (Array.isArray(type) && type.includes("JobPosting"));
      if (isPosting && typeof obj.description === "string") {
        return cleanDescription(obj.description);
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Fetch a job description from a detail page (used for sources that don't include it inline).
export async function fetchJobDescription(
  page: Page,
  url: string,
): Promise<string | null> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const jsonld = await page.$$eval(
      'script[type="application/ld+json"]',
      (els) => els.map((el) => el.textContent || ""),
    );
    for (const raw of jsonld) {
      const fromLd = jsonLdJobDescription(raw);
      if (fromLd) return fromLd;
    }

    for (const selector of DESCRIPTION_SELECTORS) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text) {
            const cleaned = cleanDescription(text);
            if (cleaned && cleaned.length > 200) return cleaned;
          }
        }
      } catch {
        continue;
      }
    }

    const main = await page.locator("main").first().textContent().catch(() => null);
    if (main) {
      const cleaned = cleanDescription(main);
      if (cleaned && cleaned.length > 200) return cleaned;
    }
    return null;
  } catch {
    return null;
  }
}
