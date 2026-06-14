import { getAllJobs } from '@/lib/data/employer';
import type { JobWithCompany } from '@/lib/types';

export {
  buildWeeklyDigestHtml,
  weeklyDigestSubject,
  weeklyDigestPreheader,
  weeklyDigestPlainText,
} from './templates/weeklyDigest';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_JOBS = 20;
const MIN_JOBS = 5;

export async function getWeeklyDigestJobs(): Promise<JobWithCompany[]> {
  const allJobs = await getAllJobs();
  if (allJobs.length === 0) return [];

  const weekAgo = Date.now() - WEEK_MS;
  const thisWeek = allJobs.filter((job) => new Date(job.scraped_at).getTime() >= weekAgo);

  const jobs = thisWeek.length >= MIN_JOBS ? thisWeek : allJobs;

  return jobs.slice(0, MAX_JOBS);
}
