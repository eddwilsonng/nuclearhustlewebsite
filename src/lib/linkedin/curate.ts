import { getJobsWithCompany } from '@/lib/data/static';
import type { JobWithCompany } from '@/lib/types';

const MAX_POSTS = 8;
const FRESH_WINDOW_MS = 48 * 60 * 60 * 1000; // 48h
const FALLBACK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function score(job: JobWithCompany): number {
  let s = 0;
  const ageMs = Date.now() - new Date(job.scraped_at).getTime();

  // Freshness — recency is the main signal for a "new jobs" post
  if (ageMs < 24 * 60 * 60 * 1000) s += 40;
  else if (ageMs < 48 * 60 * 60 * 1000) s += 25;
  else if (ageMs < 7 * 24 * 60 * 60 * 1000) s += 10;

  // Salary — the single strongest engagement hook on LinkedIn
  if (job.salary) s += 30;

  // Employer-direct postings are higher quality signals
  if (job.isEmployerJob) s += 15;

  // Featured listings
  if (job.is_featured) s += 10;

  return s;
}

export interface CuratedJob {
  job: JobWithCompany;
  score: number;
}

// Cheap seedable shuffle — lets the rerun button surface different picks
// from among jobs that share the same score.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function curateForLinkedIn(seed = 0): CuratedJob[] {
  const all = getJobsWithCompany();
  const now = Date.now();

  // Prefer fresh window; fall back to week if too few fresh jobs
  const fresh = all.filter((j) => now - new Date(j.scraped_at).getTime() < FRESH_WINDOW_MS);
  const pool = fresh.length >= 4 ? fresh : all.filter(
    (j) => now - new Date(j.scraped_at).getTime() < FALLBACK_WINDOW_MS
  );

  // Shuffle within score tiers so rerun surfaces different picks
  const scored = seededShuffle(
    pool.map((job) => ({ job, score: score(job) })),
    seed
  ).sort((a, b) => b.score - a.score);

  // Enforce diversity: max 2 per company, max 3 per category
  const companyCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const picks: CuratedJob[] = [];

  for (const item of scored) {
    if (picks.length >= MAX_POSTS) break;
    const cc = companyCounts.get(item.job.company_id) ?? 0;
    const rc = categoryCounts.get(item.job.category) ?? 0;
    if (cc >= 2 || rc >= 3) continue;
    picks.push(item);
    companyCounts.set(item.job.company_id, cc + 1);
    categoryCounts.set(item.job.category, rc + 1);
  }

  return picks;
}
