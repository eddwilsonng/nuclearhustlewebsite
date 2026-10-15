import { getAllJobs } from '@/lib/data/employer';
import type { JobWithCompany } from '@/lib/types';
import { jobFirstSeenAt } from './firstSeen';

export {
  buildWeeklyDigestHtml,
  weeklyDigestSubject,
  weeklyDigestPreheader,
  weeklyDigestPlainText,
} from './templates/weeklyDigest';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getWeeklyDigestJobs(): Promise<JobWithCompany[]> {
  const allJobs = await getAllJobs();
  const since = Date.now() - WEEK_MS;

  return allJobs
    .filter((job) => new Date(jobFirstSeenAt(job)).getTime() >= since)
    .sort(
      (a, b) => new Date(jobFirstSeenAt(b)).getTime() - new Date(jobFirstSeenAt(a)).getTime(),
    );
}
