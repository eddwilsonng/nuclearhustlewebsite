import type { JobWithCompany, JobListItem } from './types';

export function toJobListItem(job: JobWithCompany): JobListItem {
  return {
    id: job.id,
    company_id: job.company_id,
    title: job.title,
    location: job.location,
    slug: job.slug,
    category: job.category,
    scraped_at: job.scraped_at,
    employment_type: job.employment_type,
    skills: (job.skills || job.structured_description?.skills)?.slice(0, 3),
    isEmployerJob: job.isEmployerJob,
    is_featured: job.is_featured,
    featured_until: job.featured_until,
    company: { id: job.company.id, name: job.company.name },
  };
}
