import companiesData from '@/data/companies.json';
import jobsData from '@/data/jobs.json';
import { Company, Plant, Job, JobWithCompany, JobListItem, Region } from '../types';
import { JobCategory, getCategoryInfo } from '../categorize';
import { getStateBySlug, StateInfo } from '../states';

export function getCompanies(): Company[] {
  return companiesData.companies as Company[];
}

export function getCompanyById(id: string): Company | undefined {
  return companiesData.companies.find((c) => c.id === id) as Company | undefined;
}

export function getPlants(): Plant[] {
  return companiesData.plants as Plant[];
}

export function getPlantsByCompany(companyId: string): Plant[] {
  return companiesData.plants.filter((p) => p.company_id === companyId) as Plant[];
}

export function getJobs(): Job[] {
  return (jobsData.jobs as Job[]).filter(j => !j.status || j.status === 'published');
}

export function getAllJobsForAdmin(): Job[] {
  return jobsData.jobs as Job[];
}

export function getJobsWithCompany(filters?: {
  companyId?: string;
  region?: Region;
  search?: string;
}): JobWithCompany[] {
  let jobs = jobsData.jobs as Job[];
  const companies = companiesData.companies as Company[];
  const plants = companiesData.plants as Plant[];

  if (filters?.companyId) {
    jobs = jobs.filter((j) => j.company_id === filters.companyId);
  }

  if (filters?.region) {
    const companyIdsInRegion = new Set(
      plants.filter((p) => p.region === filters.region).map((p) => p.company_id)
    );
    jobs = jobs.filter((j) => companyIdsInRegion.has(j.company_id));
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(searchLower) ||
        j.location.toLowerCase().includes(searchLower)
    );
  }

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

export function getJobById(id: string): JobWithCompany | undefined {
  const job = jobsData.jobs.find((j) => j.id === id) as Job | undefined;
  if (!job) return undefined;

  const company = companiesData.companies.find(
    (c) => c.id === job.company_id
  ) as Company;

  return { ...job, company };
}

export function getActiveRegions(): Region[] {
  const plants = companiesData.plants as Plant[];
  return [...new Set(plants.map((p) => p.region))] as Region[];
}

export function getJobBySlug(slug: string): JobWithCompany | undefined {
  const job = jobsData.jobs.find((j) => j.slug === slug) as Job | undefined;
  if (!job) return undefined;

  const company = companiesData.companies.find(
    (c) => c.id === job.company_id
  ) as Company;

  return { ...job, company };
}

export function getJobsByState(stateSlug: string): JobWithCompany[] {
  const jobs = (jobsData.jobs as Job[]).filter((j) => j.state === stateSlug);
  const companies = companiesData.companies as Company[];

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

export function getJobsByCategory(category: JobCategory): JobWithCompany[] {
  const jobs = (jobsData.jobs as Job[]).filter((j) => j.category === category);
  const companies = companiesData.companies as Company[];

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

export function getActiveStates(): { state: StateInfo; count: number }[] {
  const jobs = jobsData.jobs as Job[];
  const stateCounts = new Map<string, number>();

  for (const job of jobs) {
    if (job.state) {
      stateCounts.set(job.state, (stateCounts.get(job.state) || 0) + 1);
    }
  }

  return Array.from(stateCounts.entries())
    .map(([slug, count]) => ({
      state: getStateBySlug(slug)!,
      count,
    }))
    .filter((s) => s.state !== null)
    .sort((a, b) => b.count - a.count);
}

export function getActiveCategories(): { category: JobCategory; name: string; count: number }[] {
  const jobs = jobsData.jobs as Job[];
  const categoryCounts = new Map<JobCategory, number>();

  for (const job of jobs) {
    categoryCounts.set(job.category, (categoryCounts.get(job.category) || 0) + 1);
  }

  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({
      category,
      name: getCategoryInfo(category).name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getAllJobSlugs(): string[] {
  return (jobsData.jobs as Job[]).map((j) => j.slug);
}

export function getAllStateSlugs(): string[] {
  const jobs = jobsData.jobs as Job[];
  const states = new Set<string>();
  for (const job of jobs) {
    if (job.state) states.add(job.state);
  }
  return Array.from(states);
}

export function getJobsByCompany(companyId: string): JobWithCompany[] {
  const jobs = (jobsData.jobs as Job[]).filter((j) => j.company_id === companyId);
  const companies = companiesData.companies as Company[];

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

export function toJobListItem(job: JobWithCompany): JobListItem {
  return {
    id: job.id,
    company_id: job.company_id,
    title: job.title,
    location: job.location,
    slug: job.slug,
    category: job.category,
    scraped_at: job.scraped_at,
    isEmployerJob: job.isEmployerJob,
    company: { id: job.company.id, name: job.company.name },
  };
}

export function getJobsForList(filters?: {
  companyId?: string;
  region?: Region;
  search?: string;
}): JobListItem[] {
  return getJobsWithCompany(filters).map(toJobListItem);
}

export function getRelatedJobs(job: Job, limit: number = 5): JobWithCompany[] {
  const allJobs = jobsData.jobs as Job[];
  const companies = companiesData.companies as Company[];

  const related = allJobs
    .filter((j) => j.id !== job.id && (j.category === job.category || j.company_id === job.company_id))
    .slice(0, limit);

  return related.map((j) => ({
    ...j,
    company: companies.find((c) => c.id === j.company_id)!,
  }));
}
