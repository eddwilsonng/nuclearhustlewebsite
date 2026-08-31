/**
 * Backfill structured_description for published jobs that went live as raw ATS.
 * Also unpublish mixed-fleet false positives (PMC I&C, etc.).
 *
 *   npx tsx scraper/format-local.ts
 *   npx tsx scraper/format-local.ts --dry-run
 *   npx tsx scraper/format-local.ts --reformat   # redo Local-review jobs
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  formatJobDescriptionLocal,
  isMixedFleetFalsePositive,
} from '../src/lib/formatJobDescriptionLocal';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
const DRY = process.argv.includes('--dry-run');
const REFORMAT = process.argv.includes('--reformat');

interface Job {
  id: string;
  title: string;
  location?: string;
  description?: string;
  company_id: string;
  slug: string;
  status?: string;
  structured_description?: unknown;
  review_notes?: string;
  agent_confidence?: string;
}

function main() {
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as { jobs: Job[] };

  let formatted = 0;
  let unpublished = 0;
  let skippedThin = 0;
  let held = 0;

  for (const job of data.jobs) {
    if (job.status !== 'published') continue;

    if (isMixedFleetFalsePositive(job)) {
      job.status = 'rejected';
      job.agent_confidence = 'low';
      job.review_notes = 'Local review: mixed-fleet PMC/generation role, not a nuclear plant listing';
      unpublished++;
      continue;
    }

    if (/\bgeneral application\b|\bopen call\b/i.test(job.title)) {
      job.status = 'rejected';
      job.agent_confidence = 'low';
      job.review_notes = 'Local review: talent-pool / general application, not a listing';
      unpublished++;
      continue;
    }

    const localReview = (job.review_notes || '').startsWith('Local review:');
    const shouldFormat =
      !job.structured_description || (REFORMAT && localReview);

    if (!shouldFormat) continue;

    if (!job.description || job.description.length < 80) {
      job.status = 'pending_review';
      job.agent_confidence = 'low';
      job.review_notes = `Local review: held — no description to format`;
      held++;
      continue;
    }

    const sd = formatJobDescriptionLocal(job.description, job.title);
    if (!sd.about && !sd.responsibilities) {
      skippedThin++;
      continue;
    }

    job.structured_description = sd;
    formatted++;
  }

  if (!DRY) {
    fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');
  }

  console.log(
    `${DRY ? '[dry-run] ' : ''}formatted ${formatted}, unpublished ${unpublished}, held (no desc) ${held}, still thin ${skippedThin}`,
  );
}

main();
