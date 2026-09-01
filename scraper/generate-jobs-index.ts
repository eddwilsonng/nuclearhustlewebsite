/**
 * Build a slim public jobs index from jobs.json for fast server reads and to
 * keep full descriptions out of list-page bundles. Run after every scrape/hygiene.
 *
 *   npm run generate-jobs-index
 */
import * as fs from "fs";
import * as path from "path";
import type { Job } from "../src/lib/types";

const JOBS_PATH = path.join(__dirname, "..", "src", "data", "jobs.json");
const INDEX_PATH = path.join(__dirname, "..", "src", "data", "jobs-index.json");

function isPublished(job: Job): boolean {
  return !job.status || job.status === "published";
}

function toIndexJob(job: Job): Job {
  const skills = job.skills ?? job.structured_description?.skills;
  const structured_description =
    skills && skills.length > 0 ? { skills } : undefined;

  return {
    id: job.id,
    company_id: job.company_id,
    title: job.title,
    location: job.location,
    url: job.url,
    scraped_at: job.scraped_at,
    slug: job.slug,
    state: job.state,
    category: job.category,
    salary: job.salary ?? null,
    employment_type: job.employment_type,
    skills,
    structured_description,
    status: job.status,
    is_featured: job.is_featured,
    featured_until: job.featured_until,
  };
}

export function generateJobsIndex(): { published: number; bytes: number } {
  const raw = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8")) as { jobs: Job[] };
  const published = raw.jobs.filter(isPublished).map(toIndexJob);
  const payload = {
    generatedAt: new Date().toISOString(),
    jobs: published,
  };
  const json = JSON.stringify(payload);
  fs.writeFileSync(INDEX_PATH, json);
  return { published: published.length, bytes: Buffer.byteLength(json, "utf8") };
}

if (require.main === module) {
  const { published, bytes } = generateJobsIndex();
  console.log(
    `jobs-index.json: ${published} published jobs (${(bytes / 1024).toFixed(1)} KB)`,
  );
}
