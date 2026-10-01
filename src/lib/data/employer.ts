import 'server-only';

import { cache } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { Company, JobWithCompany, JobListItem, Region, EmployerJobWithProfile } from '../types';
import { JobCategory } from '../categorize';
import { createClient } from '@/lib/supabase/server';
import { extractState, normalizeStateSlug, StateInfo } from '@/lib/states';
import {
  getCompanies,
  getCompanyById,
  getJobsWithCompany,
  getJobsByState,
  getJobsByCategory,
  getJobsByStateAndCategory,
  getJobsByEngineeringDiscipline,
  getJobsByCompany,
  getAllJobSlugs,
  toJobListItem,
  countStates,
  countCategories,
  countCategoriesInState,
  countStateCategoryCombos,
  countEngineeringDisciplines,
  filterByEngineeringDiscipline,
} from './static';
import { getJobBySlug } from './jobs-full';

const EMPLOYER_JOB_SELECT = `
  *,
  employer:employer_profiles(*)
`;

function toEmployerCompany(employer: EmployerJobWithProfile['employer']): Company {
  return {
    id: employer.company_slug,
    name: employer.company_name,
    careers_url: employer.company_website || '',
    scraper_type: 'custom',
    last_scraped: null,
    description: employer.company_description || null,
    logo_url: employer.company_logo_url || null,
  };
}

function toEmployerJob(job: EmployerJobWithProfile): JobWithCompany {
  const company = toEmployerCompany(job.employer);

  return {
    id: `employer-${job.id}`,
    company_id: company.id,
    title: job.title,
    location: job.location,
    url: job.application_url || `/job/${job.slug}`,
    scraped_at: job.created_at,
    slug: job.slug,
    // Older rows stored the raw postal code ("pa"); public pages key on slugs.
    state: normalizeStateSlug(job.state) ?? extractState(job.location),
    category: job.category as JobCategory,
    description: job.description,
    structured_description: job.structured_description ?? null,
    isEmployerJob: true,
    is_featured: job.is_featured ?? false,
    featured_until: job.featured_until ?? null,
    application_type: job.application_type ?? 'link',
    employment_type: job.employment_type,
    work_mode: job.work_mode ?? null,
    plant_id: job.plant_id ?? null,
    salary:
      job.salary_min || job.salary_max
        ? {
            min: job.salary_min ?? null,
            max: job.salary_max ?? null,
            period: job.salary_period ?? 'year',
            source: 'structured',
          }
        : null,
    company,
  };
}

function liveFilter() {
  return `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;
}

function byNewest(a: JobWithCompany, b: JobWithCompany) {
  return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
}

export const getEmployerJobs = cache(async (): Promise<JobWithCompany[]> => {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employer_jobs')
      .select(EMPLOYER_JOB_SELECT)
      .eq('is_active', true)
      .or(liveFilter())
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching employer jobs:', error);
      return [];
    }

    return (data as EmployerJobWithProfile[])
      .filter((job) => job.employer)
      .map(toEmployerJob);
  } catch (error) {
    unstable_rethrow(error);
    console.error('Error fetching employer jobs:', error);
    return [];
  }
});

export async function getEmployerJobBySlug(slug: string): Promise<JobWithCompany | undefined> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employer_jobs')
      .select(EMPLOYER_JOB_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .or(liveFilter())
      .single();

    if (error || !data || !(data as EmployerJobWithProfile).employer) {
      return undefined;
    }

    return toEmployerJob(data as EmployerJobWithProfile);
  } catch (error) {
    unstable_rethrow(error);
    return undefined;
  }
}

export async function getFeaturedJobs(): Promise<JobWithCompany[]> {
  const now = new Date().toISOString();
  return (await getEmployerJobs()).filter(
    (job) => job.is_featured && !!job.featured_until && job.featured_until > now
  );
}

export async function getAnyJobBySlug(slug: string): Promise<JobWithCompany | undefined> {
  const scrapedJob = getJobBySlug(slug);
  if (scrapedJob) return scrapedJob;

  return getEmployerJobBySlug(slug);
}

// --- Merged public views (scraped + employer-posted) -------------------------
// Every public listing surface reads through these so a job posted from the
// employer dashboard shows up everywhere a scraped job would.

export async function getAllJobs(filters?: {
  companyId?: string;
  region?: Region;
  search?: string;
}): Promise<JobWithCompany[]> {
  const scrapedJobs = getJobsWithCompany(filters);
  let employerJobs = await getEmployerJobs();

  // Employer companies have no plants, so a region filter can never match them.
  if (filters?.region) employerJobs = [];

  if (filters?.companyId) {
    employerJobs = employerJobs.filter((j) => j.company_id === filters.companyId);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    employerJobs = employerJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(searchLower) ||
        j.location.toLowerCase().includes(searchLower)
    );
  }

  return [...scrapedJobs, ...employerJobs].sort(byNewest);
}

export async function getAllJobsForList(): Promise<JobListItem[]> {
  return (await getAllJobs()).map(toJobListItem);
}

export async function getAllJobsByState(stateSlug: string): Promise<JobWithCompany[]> {
  const employerJobs = (await getEmployerJobs()).filter((j) => j.state === stateSlug);
  return [...getJobsByState(stateSlug), ...employerJobs].sort(byNewest);
}

export async function getAllJobsByCategory(category: JobCategory): Promise<JobWithCompany[]> {
  const employerJobs = (await getEmployerJobs()).filter((j) => j.category === category);
  return [...getJobsByCategory(category), ...employerJobs].sort(byNewest);
}

export async function getAllJobsByStateAndCategory(
  stateSlug: string,
  category: JobCategory
): Promise<JobWithCompany[]> {
  const employerJobs = (await getEmployerJobs()).filter(
    (j) => j.state === stateSlug && j.category === category
  );
  return [...getJobsByStateAndCategory(stateSlug, category), ...employerJobs].sort(byNewest);
}

export async function getAllJobsByEngineeringDiscipline(slug: string): Promise<JobWithCompany[]> {
  const employerJobs = filterByEngineeringDiscipline(await getEmployerJobs(), slug);
  return [...getJobsByEngineeringDiscipline(slug), ...employerJobs].sort(byNewest);
}

export async function getAllJobsByCompany(companyId: string): Promise<JobWithCompany[]> {
  const employerJobs = (await getEmployerJobs()).filter((j) => j.company_id === companyId);
  return [...getJobsByCompany(companyId), ...employerJobs].sort(byNewest);
}

export async function getAllPublicJobSlugs(): Promise<string[]> {
  return [...getAllJobSlugs(), ...(await getEmployerJobs()).map((j) => j.slug)];
}

/** Static operators plus any employer with at least one live posting. */
export async function getAllCompanies(): Promise<Company[]> {
  const companies = [...getCompanies()];
  const knownIds = new Set(companies.map((c) => c.id));

  for (const job of await getEmployerJobs()) {
    if (knownIds.has(job.company.id)) continue;
    knownIds.add(job.company.id);
    companies.push(job.company);
  }

  return companies;
}

export async function getAnyCompanyById(id: string): Promise<Company | undefined> {
  return getCompanyById(id) ?? (await getAllCompanies()).find((c) => c.id === id);
}

export async function getAllActiveStates(): Promise<{ state: StateInfo; count: number }[]> {
  return countStates(await getAllJobs());
}

export async function getAllActiveCategories(): Promise<
  { category: JobCategory; name: string; count: number }[]
> {
  return countCategories(await getAllJobs());
}

export async function getAllActiveCategoriesByState(
  stateSlug: string
): Promise<{ category: JobCategory; name: string; count: number }[]> {
  return countCategoriesInState(await getAllJobs(), stateSlug);
}

export async function getAllActiveStateCategoryCombos(): Promise<
  { stateSlug: string; category: JobCategory; count: number }[]
> {
  return countStateCategoryCombos(await getAllJobs());
}

export async function getAllActiveEngineeringDisciplines(): Promise<
  { slug: string; name: string; count: number }[]
> {
  return countEngineeringDisciplines(await getAllJobs());
}
