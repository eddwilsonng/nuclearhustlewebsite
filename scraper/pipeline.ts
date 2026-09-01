/**
 * One-command ingest: crawl → AI review → auto-publish high-confidence → hygiene.
 *
 *   npm run ingest
 *
 * Writes scraper/last-run.json (gitignored) so this chat can show you the
 * flagged leftover without re-reading all of jobs.json.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { recordAgentRun } from '../src/lib/ops/runLog';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const LAST_RUN_PATH = path.join(__dirname, 'last-run.json');

export interface IngestReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scrape: {
    companiesOk: number;
    companiesTotal: number;
    failed: { id: string; name: string; error?: string }[];
    skipped: string[];
    new: number;
    updated: number;
    dropped: number;
    kept: number;
  };
  review: {
    skipped?: string;
    processed: number;
    published: number;
    flagged: number;
    rejected: number;
    failed: number;
  };
  hygiene: {
    candidates: number;
    dead: number;
    alive: number;
    inconclusive: number;
    expired: number;
    totalExpired: number;
  };
  published: { id: string; title: string; company_id: string; slug?: string; reason: string }[];
  flagged: {
    id: string;
    title: string;
    company_id: string;
    location?: string;
    reason: string;
    confidence?: string;
  }[];
  rejected: { id: string; title: string; company_id: string; reason: string }[];
}

async function ingest(): Promise<void> {
  const startedAt = new Date();
  console.log('=== Ingest: scrape → review → publish → hygiene ===\n');

  const { runScrapers } = await import('./index');
  const scrape = await runScrapers();

  console.log('\n=== Phase 2: AI review + auto-publish ===\n');
  const { runAiReview } = await import('./process-pending');
  const review = await runAiReview({ autoPublish: true });

  console.log('\n=== Phase 3: Hygiene ===\n');
  const { runHygiene } = await import('./hygiene');
  const hygiene = await runHygiene();

  const finishedAt = new Date();
  const report: IngestReport = {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    scrape: {
      companiesOk: scrape.successCount,
      companiesTotal: scrape.companyCount,
      failed: scrape.failedCompanies,
      skipped: scrape.skippedCompanies,
      new: scrape.totals.new,
      updated: scrape.totals.updated,
      dropped: scrape.totals.dropped,
      kept: scrape.totals.kept,
    },
    review: {
      skipped: review.skipped,
      processed: review.processed,
      published: review.published.length,
      flagged: review.flagged.length,
      rejected: review.rejected.length,
      failed: review.failed,
    },
    hygiene: {
      candidates: hygiene.candidates,
      dead: hygiene.dead,
      alive: hygiene.alive,
      inconclusive: hygiene.inconclusive,
      expired: hygiene.expired,
      totalExpired: hygiene.totalExpired,
    },
    published: review.published.map((j) => ({
      id: j.id,
      title: j.title,
      company_id: j.company_id,
      slug: j.slug,
      reason: j.reason,
    })),
    flagged: review.flagged.map((j) => ({
      id: j.id,
      title: j.title,
      company_id: j.company_id,
      location: j.location,
      reason: j.reason,
      confidence: j.confidence,
    })),
    rejected: review.rejected.map((j) => ({
      id: j.id,
      title: j.title,
      company_id: j.company_id,
      reason: j.reason,
    })),
  };

  fs.writeFileSync(LAST_RUN_PATH, JSON.stringify(report, null, 2) + '\n');

  recordAgentRun({
    type: 'ingest',
    label: `Ingest — ${review.published.length} published, ${review.flagged.length} flagged, ${hygiene.expired} expired`,
    status: scrape.successCount > 0 ? 'success' : 'error',
    startedAt: report.startedAt,
    finishedAt: report.finishedAt,
    durationMs: report.durationMs,
    stats: {
      new: scrape.totals.new,
      published: review.published.length,
      flagged: review.flagged.length,
      rejected: review.rejected.length,
      expired: hygiene.expired,
    },
  });

  console.log('\n=== Ingest complete ===');
  console.log(
    `Scraped ${scrape.successCount}/${scrape.companyCount} sources · ` +
      `+${scrape.totals.new} new, ${scrape.totals.dropped} keyword-dropped`
  );
  if (review.skipped) {
    console.log(`AI review skipped: ${review.skipped}`);
  } else {
    console.log(
      `AI: ${review.published.length} published, ${review.flagged.length} flagged, ` +
        `${review.rejected.length} rejected, ${review.failed} failed`
    );
  }
  console.log(`Hygiene: ${hygiene.expired} newly expired (${hygiene.candidates} probed)`);
  const { generateJobsIndex } = await import('./generate-jobs-index');
  const index = generateJobsIndex();
  console.log(`jobs-index.json: ${index.published} published jobs (${(index.bytes / 1024).toFixed(1)} KB)`);
  console.log(`Report: ${LAST_RUN_PATH}`);
  if (review.flagged.length > 0) {
    console.log(`\n${review.flagged.length} job(s) need a look in this chat before they go live.`);
  }
}

ingest().catch((err) => {
  console.error('Ingest failed:', err);
  process.exit(1);
});
