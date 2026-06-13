import { JobWithCompany, Region, EmployerJobWithProfile } from '../types';
import { JobCategory } from '../categorize';
import { createClient } from '@/lib/supabase/server';
import { getJobsWithCompany, getJobBySlug, getJobsByState, getJobsByCategory } from './static';

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
      is_featured: (job as unknown as { is_featured: boolean }).is_featured ?? false,
      featured_until: (job as unknown as { featured_until: string | null }).featured_until ?? null,
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
    return [];
  }
}

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

export async function getAllJobs(filters?: {
  companyId?: string;
  region?: Region;
  search?: string;
}): Promise<JobWithCompany[]> {
  const scrapedJobs = getJobsWithCompany(filters);
  let employerJobs = await getEmployerJobs();

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    employerJobs = employerJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(searchLower) ||
        j.location.toLowerCase().includes(searchLower)
    );
  }

  return [...scrapedJobs, ...employerJobs].sort((a, b) => {
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });
}

export async function getAllJobsByState(stateSlug: string): Promise<JobWithCompany[]> {
  const scrapedJobs = getJobsByState(stateSlug);
  const employerJobs = (await getEmployerJobs()).filter((j) => j.state === stateSlug);

  return [...scrapedJobs, ...employerJobs].sort((a, b) => {
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });
}

export async function getAllJobsByCategory(category: JobCategory): Promise<JobWithCompany[]> {
  const scrapedJobs = getJobsByCategory(category);
  const employerJobs = (await getEmployerJobs()).filter((j) => j.category === category);

  return [...scrapedJobs, ...employerJobs].sort((a, b) => {
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });
}

export async function getAnyJobBySlug(slug: string): Promise<JobWithCompany | undefined> {
  const scrapedJob = getJobBySlug(slug);
  if (scrapedJob) return scrapedJob;

  return getEmployerJobBySlug(slug);
}

export async function getFeaturedJobs(): Promise<JobWithCompany[]> {
  try {
    const supabase = await createClient();

    const { data: featuredJobs, error } = await supabase
      .from('employer_jobs')
      .select(`
        *,
        employer:employer_profiles(*)
      `)
      .eq('is_featured', true)
      .eq('is_active', true)
      .gt('featured_until', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !featuredJobs) {
      return [];
    }

    return featuredJobs.map((job: EmployerJobWithProfile) => ({
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
      is_featured: true,
      featured_until: (job as unknown as { featured_until: string | null }).featured_until,
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
    return [];
  }
}
