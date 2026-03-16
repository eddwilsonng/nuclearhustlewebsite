import companiesData from '@/data/companies.json';
import jobsData from '@/data/jobs.json';
import { Company, Plant, Job, JobWithCompany, Region, EmployerJobWithProfile } from './types';
import { JobCategory, getCategoryInfo } from './categorize';
import { getStateBySlug, StateInfo } from './states';
import { createClient } from '@/lib/supabase/server';

// For MVP, we use local JSON. Will be replaced with Supabase queries.

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

  // Filter by company
  if (filters?.companyId) {
    jobs = jobs.filter((j) => j.company_id === filters.companyId);
  }

  // Filter by region (through plants)
  if (filters?.region) {
    const companyIdsInRegion = new Set(
      plants.filter((p) => p.region === filters.region).map((p) => p.company_id)
    );
    jobs = jobs.filter((j) => companyIdsInRegion.has(j.company_id));
  }

  // Filter by search term
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(searchLower) ||
        j.location.toLowerCase().includes(searchLower)
    );
  }

  // Join with company data
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

// Utility to get unique regions from current data
export function getActiveRegions(): Region[] {
  const plants = companiesData.plants as Plant[];
  return [...new Set(plants.map((p) => p.region))] as Region[];
}

// Get job by URL slug
export function getJobBySlug(slug: string): JobWithCompany | undefined {
  const job = jobsData.jobs.find((j) => j.slug === slug) as Job | undefined;
  if (!job) return undefined;

  const company = companiesData.companies.find(
    (c) => c.id === job.company_id
  ) as Company;

  return { ...job, company };
}

// Get all jobs for a state
export function getJobsByState(stateSlug: string): JobWithCompany[] {
  const jobs = (jobsData.jobs as Job[]).filter((j) => j.state === stateSlug);
  const companies = companiesData.companies as Company[];

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

// Get all jobs for a category
export function getJobsByCategory(category: JobCategory): JobWithCompany[] {
  const jobs = (jobsData.jobs as Job[]).filter((j) => j.category === category);
  const companies = companiesData.companies as Company[];

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

// Get states that have jobs
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

// Get categories that have jobs
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

// Get all job slugs (for static generation)
export function getAllJobSlugs(): string[] {
  return (jobsData.jobs as Job[]).map((j) => j.slug);
}

// Get all state slugs that have jobs (for static generation)
export function getAllStateSlugs(): string[] {
  const jobs = jobsData.jobs as Job[];
  const states = new Set<string>();
  for (const job of jobs) {
    if (job.state) states.add(job.state);
  }
  return Array.from(states);
}

// Get jobs by company
export function getJobsByCompany(companyId: string): JobWithCompany[] {
  const jobs = (jobsData.jobs as Job[]).filter((j) => j.company_id === companyId);
  const companies = companiesData.companies as Company[];

  return jobs.map((job) => ({
    ...job,
    company: companies.find((c) => c.id === job.company_id)!,
  }));
}

// Get related jobs (same category or company, excluding current job)
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

// ============================================
// Employer Jobs (from Supabase)
// ============================================

// Get all active employer jobs
export async function getEmployerJobs(): Promise<JobWithCompany[]> {
  try {
    const supabase = await createClient();

    const { data: employerJobs, error } = await supabase
      .from('employer_jobs')
      .select(`
        *,
        employer:employer_profiles(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !employerJobs) {
      console.error('Error fetching employer jobs:', error);
      return [];
    }

    // Convert employer jobs to JobWithCompany format
    return employerJobs.map((job: EmployerJobWithProfile) => ({
      id: `employer-${job.id}`,
      company_id: `employer-${job.employer_id}`,
      title: job.title,
      location: job.location,
      url: job.application_url || `/job/${job.slug}`,
      scraped_at: job.created_at,
      slug: job.slug,
      state: job.state,
      category: job.category as JobCategory,
      description: job.description,
      structured_description: (job as EmployerJobWithProfile & { structured_description?: unknown }).structured_description ?? null,
      isEmployerJob: true,
      application_type: (job.application_type ?? 'link') as 'link' | 'form',
      employment_type: job.employment_type,
      company: {
        id: `employer-${job.employer_id}`,
        name: job.employer.company_name,
        careers_url: job.employer.company_website || '',
        scraper_type: 'custom' as const,
        last_scraped: null,
        description: job.employer.company_description || null,
      },
    }));
  } catch {
    // Supabase not configured yet, return empty array
    return [];
  }
}

// Get employer job by slug
export async function getEmployerJobBySlug(slug: string): Promise<JobWithCompany | undefined> {
  try {
    const supabase = await createClient();

    const { data: job, error } = await supabase
      .from('employer_jobs')
      .select(`
        *,
        employer:employer_profiles(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !job) {
      return undefined;
    }

    const typedJob = job as EmployerJobWithProfile;

    return {
      id: `employer-${typedJob.id}`,
      company_id: `employer-${typedJob.employer_id}`,
      title: typedJob.title,
      location: typedJob.location,
      url: typedJob.application_url || `/job/${typedJob.slug}`,
      scraped_at: typedJob.created_at,
      slug: typedJob.slug,
      state: typedJob.state,
      category: typedJob.category as JobCategory,
      description: typedJob.description,
      structured_description: (typedJob as EmployerJobWithProfile & { structured_description?: unknown }).structured_description ?? null,
      isEmployerJob: true,
      application_type: (typedJob.application_type ?? 'link') as 'link' | 'form',
      employment_type: typedJob.employment_type,
      company: {
        id: `employer-${typedJob.employer_id}`,
        name: typedJob.employer.company_name,
        careers_url: typedJob.employer.company_website || '',
        scraper_type: 'custom' as const,
        last_scraped: null,
        description: typedJob.employer.company_description || null,
      },
    };
  } catch {
    return undefined;
  }
}

// Get all jobs (scraped + employer) unified
export async function getAllJobs(filters?: {
  companyId?: string;
  region?: Region;
  search?: string;
}): Promise<JobWithCompany[]> {
  // Get scraped jobs
  const scrapedJobs = getJobsWithCompany(filters);

  // Get employer jobs
  let employerJobs = await getEmployerJobs();

  // Apply search filter to employer jobs if needed
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    employerJobs = employerJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(searchLower) ||
        j.location.toLowerCase().includes(searchLower)
    );
  }

  // Merge and sort by date (newest first)
  const allJobs = [...scrapedJobs, ...employerJobs].sort((a, b) => {
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });

  return allJobs;
}

// Get all jobs by state (scraped + employer)
export async function getAllJobsByState(stateSlug: string): Promise<JobWithCompany[]> {
  const scrapedJobs = getJobsByState(stateSlug);
  const employerJobs = (await getEmployerJobs()).filter((j) => j.state === stateSlug);

  return [...scrapedJobs, ...employerJobs].sort((a, b) => {
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });
}

// Get all jobs by category (scraped + employer)
export async function getAllJobsByCategory(category: JobCategory): Promise<JobWithCompany[]> {
  const scrapedJobs = getJobsByCategory(category);
  const employerJobs = (await getEmployerJobs()).filter((j) => j.category === category);

  return [...scrapedJobs, ...employerJobs].sort((a, b) => {
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });
}

// Get job by slug (check both scraped and employer jobs)
export async function getAnyJobBySlug(slug: string): Promise<JobWithCompany | undefined> {
  // First try scraped jobs (synchronous)
  const scrapedJob = getJobBySlug(slug);
  if (scrapedJob) return scrapedJob;

  // Then try employer jobs (async)
  return getEmployerJobBySlug(slug);
}
