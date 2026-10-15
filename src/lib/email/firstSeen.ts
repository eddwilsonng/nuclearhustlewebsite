import firstSeenById from "@/data/job-first-seen.json";
import type { JobWithCompany } from "@/lib/types";

const stamps = firstSeenById as Record<string, string>;

/** When this role first landed. Re-scrapes move scraped_at; they must not move this. */
export function jobFirstSeenAt(job: Pick<JobWithCompany, "id" | "scraped_at" | "first_seen_at" | "isEmployerJob">): string {
  if (job.isEmployerJob) return job.scraped_at;
  return job.first_seen_at ?? stamps[job.id] ?? job.scraped_at;
}
