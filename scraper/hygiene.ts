import * as fs from 'fs';
import * as path from 'path';
import { EnrichedJob } from './enrich';
import { recordAgentRun } from '../src/lib/ops/runLog';

/**
 * Job hygiene: detect and expire dead listings.
 *
 * A job is expired only when it BOTH disappeared from its source scrape AND a
 * live HTTP probe of its URL returns 404/410 — and only after 2 consecutive
 * dead probes (a two-strike rule, so a one-off ATS outage or bot-block can't
 * wipe good jobs). Expired jobs get `status: 'expired'`, which the app's
 * `publishedJobs()` filter excludes from every listing + the sitemap, and the
 * slug is written to expired-slugs.json so middleware serves a 410 Gone.
 *
 * "Disappeared from source" is judged per-company: a job is a candidate only if
 * its last_seen_at is older than the newest last_seen_at among its own company's
 * jobs. If a company's scraper fails entirely, none of its jobs get a fresh
 * timestamp, so none look "unseen" — no mass false-expiry on scraper breakage.
 */

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
const EXPIRED_SLUGS_PATH = path.join(__dirname, '..', 'src', 'data', 'expired-slugs.json');

const CONCURRENCY = 8;
const TIMEOUT_MS = 10_000;
const FAILURES_TO_EXPIRE = 2;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

type ProbeResult = 'dead' | 'alive' | 'inconclusive';

function loadJobs(): EnrichedJob[] {
  return (JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')).jobs as EnrichedJob[]) || [];
}

// Effective "last seen at source" — backfills pre-hygiene jobs via scraped_at.
function effectiveSeen(job: EnrichedJob): string {
  return job.last_seen_at ?? job.scraped_at;
}

function isPublic(job: EnrichedJob): boolean {
  return !job.status || job.status === 'published';
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  async function worker(): Promise<void> {
    while (idx < items.length) {
      const cur = idx++;
      await fn(items[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

// Probe a job URL. 404/410 → dead; 200 → alive; everything else (403/429/5xx,
// redirects we can't resolve, timeouts, network errors) → inconclusive, which
// never penalises the job's failure counter.
async function probe(url: string): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (res.status === 404 || res.status === 410) return 'dead';
    if (res.status === 200) return 'alive';
    return 'inconclusive';
  } catch {
    return 'inconclusive';
  } finally {
    clearTimeout(timer);
  }
}

async function runHygiene(): Promise<void> {
  const startedAt = new Date();
  const now = startedAt.toISOString();
  const jobs = loadJobs();

  console.log(`Job hygiene — ${jobs.length} jobs loaded`);

  // Newest "seen at source" timestamp per company.
  const companyMax = new Map<string, string>();
  for (const job of jobs) {
    const seen = effectiveSeen(job);
    const cur = companyMax.get(job.company_id);
    if (!cur || seen > cur) companyMax.set(job.company_id, seen);
  }

  // Candidates: public jobs that were NOT seen in their company's latest scrape.
  const candidates = jobs.filter(
    (job) => isPublic(job) && effectiveSeen(job) < (companyMax.get(job.company_id) ?? '')
  );
  console.log(`${candidates.length} unseen public jobs to probe (concurrency ${CONCURRENCY})\n`);

  let dead = 0;
  let alive = 0;
  let inconclusive = 0;
  let expired = 0;

  await mapLimit(candidates, CONCURRENCY, async (job) => {
    const result = await probe(job.url);
    job.last_checked_at = now;

    if (result === 'dead') {
      dead++;
      job.link_check_failures = (job.link_check_failures ?? 0) + 1;
      if (job.link_check_failures >= FAILURES_TO_EXPIRE) {
        job.pre_expiry_status = job.status === 'pending_review' ? 'pending_review' : 'published';
        job.status = 'expired';
        job.expired_at = now;
        expired++;
        console.log(`  EXPIRED  ${job.slug} (${job.link_check_failures} dead checks) — ${job.url}`);
      } else {
        console.log(`  strike ${job.link_check_failures}  ${job.slug} — ${job.url}`);
      }
    } else if (result === 'alive') {
      alive++;
      job.link_check_failures = 0;
    } else {
      inconclusive++;
    }
  });

  // Persist jobs + regenerate the compact expired-slug index for middleware.
  fs.writeFileSync(JOBS_PATH, JSON.stringify({ jobs }, null, 2) + '\n');

  const expiredIndex = jobs
    .filter((job) => job.status === 'expired')
    .map((job) => ({ slug: job.slug, state: job.state, category: job.category }));
  fs.writeFileSync(EXPIRED_SLUGS_PATH, JSON.stringify(expiredIndex, null, 2) + '\n');

  console.log(
    `\nDone. probed ${candidates.length} — ${dead} dead, ${alive} alive, ${inconclusive} inconclusive.`
  );
  console.log(`Newly expired this run: ${expired}. Total expired listings: ${expiredIndex.length}.`);

  const finishedAt = new Date();
  recordAgentRun({
    type: 'hygiene',
    label: `Hygiene — ${candidates.length} probed, ${expired} expired (${expiredIndex.length} total)`,
    status: 'success',
    startedAt: now,
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    stats: {
      candidates: candidates.length,
      dead,
      alive,
      inconclusive,
      expired,
      totalExpired: expiredIndex.length,
    },
  });
}

runHygiene().catch((err) => {
  console.error('Hygiene run failed:', err);
  process.exit(1);
});
