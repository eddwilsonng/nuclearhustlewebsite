import "server-only";

import jobsIndex from "@/data/jobs-index.json";
import { getCategoryInfo, type JobCategory } from "./categorize";
import { getCompanies, getJobs } from "./data/static";
import type { Salary } from "./types";

const ANNUAL_HOURS = 2080;
const RELIABLE_MIN = 4;
/** Name the largest disclosing employer once they are this share of the set. */
const DOMINANT_SHARE = 0.25;

const ROLE_LABELS: Partial<Record<JobCategory, string>> = {
  engineering: "Engineering",
  operations: "Operations",
  maintenance: "Maintenance",
  "health-physics": "Health Physics",
  training: "Training & Licensing",
  administrative: "Administrative",
  security: "Security",
};

export interface ListingSalaryRange {
  category: JobCategory;
  label: string;
  n: number;
  /** Median of posted-range midpoints, in thousands. */
  medianK: number;
  /** Median of posted minimums, in thousands. */
  lowK: number;
  /** Median of posted maximums, in thousands. */
  highK: number;
  reliable: boolean;
}

export interface ListingSalarySnapshot {
  publishedCount: number;
  disclosingCount: number;
  /** Disclosing listings left out of the table (no role category). */
  uncategorizedCount: number;
  asOfLabel: string;
  topEmployer: { name: string; count: number; share: number } | null;
  ranges: ListingSalaryRange[];
}

function toAnnual(salary: Salary): { min: number; max: number; mid: number } | null {
  const rawMin = salary.min ?? salary.max;
  const rawMax = salary.max ?? salary.min;
  if (rawMin == null || rawMax == null) return null;
  const factor = salary.period === "hour" ? ANNUAL_HOURS : 1;
  const min = Math.min(rawMin, rawMax) * factor;
  const max = Math.max(rawMin, rawMax) * factor;
  return { min, max, mid: (min + max) / 2 };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function toThousands(value: number): number {
  return Math.round(value / 1000);
}

function formatAsOf(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** Pay bands from published listings that state compensation. */
export function getListingSalarySnapshot(): ListingSalarySnapshot {
  const jobs = getJobs();
  const companies = getCompanies();
  const companyName = new Map(companies.map((company) => [company.id, company.name]));

  const byCategory = new Map<JobCategory, { min: number; max: number; mid: number }[]>();
  const byCompany = new Map<string, number>();
  let disclosingCount = 0;
  let uncategorizedCount = 0;

  for (const job of jobs) {
    if (!job.salary) continue;
    const annual = toAnnual(job.salary);
    if (!annual) continue;

    disclosingCount += 1;
    byCompany.set(job.company_id, (byCompany.get(job.company_id) ?? 0) + 1);

    if (!ROLE_LABELS[job.category]) {
      uncategorizedCount += 1;
      continue;
    }

    const bucket = byCategory.get(job.category) ?? [];
    bucket.push(annual);
    byCategory.set(job.category, bucket);
  }

  const ranges = [...byCategory.entries()]
    .map(([category, rows]) => ({
      category,
      label: ROLE_LABELS[category] ?? getCategoryInfo(category).name,
      n: rows.length,
      medianK: toThousands(median(rows.map((row) => row.mid))),
      lowK: toThousands(median(rows.map((row) => row.min))),
      highK: toThousands(median(rows.map((row) => row.max))),
      reliable: rows.length >= RELIABLE_MIN,
    }))
    .sort((a, b) => b.medianK - a.medianK || b.n - a.n);

  const [topCompanyId, topCount] =
    [...byCompany.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const topShare = topCount && disclosingCount ? topCount / disclosingCount : 0;
  const topEmployer =
    topCompanyId && topCount && topShare >= DOMINANT_SHARE
      ? {
          name: companyName.get(topCompanyId) ?? topCompanyId,
          count: topCount,
          share: Math.round(topShare * 100),
        }
      : null;

  const generatedAt = "generatedAt" in jobsIndex ? jobsIndex.generatedAt : null;
  const asOfLabel = formatAsOf(
    typeof generatedAt === "string" ? generatedAt : jobs[0]?.scraped_at ?? new Date().toISOString(),
  );

  return {
    publishedCount: jobs.length,
    disclosingCount,
    uncategorizedCount,
    asOfLabel,
    topEmployer,
    ranges,
  };
}
