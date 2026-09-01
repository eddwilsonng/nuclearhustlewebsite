import "server-only";

import companiesData from "@/data/companies.json";
import jobsData from "@/data/jobs.json";
import type { Company, Job, JobWithCompany } from "../types";

function withCompany(job: Job): JobWithCompany {
  const company = companiesData.companies.find(
    (c) => c.id === job.company_id,
  ) as Company;
  return { ...job, company };
}

export function getAllScrapedJobs(): Job[] {
  return jobsData.jobs as Job[];
}

export function getAllJobsForAdmin(): Job[] {
  return getAllScrapedJobs();
}

/** Full scraped job record (includes description) for detail pages. */
export function getJobBySlug(slug: string): JobWithCompany | undefined {
  const job = (jobsData.jobs as Job[]).find(
    (j) => j.slug === slug && (!j.status || j.status === "published"),
  );
  if (!job) return undefined;
  return withCompany(job);
}

export function getJobById(id: string): JobWithCompany | undefined {
  const job = (jobsData.jobs as Job[]).find((j) => j.id === id);
  if (!job) return undefined;
  return withCompany(job);
}
