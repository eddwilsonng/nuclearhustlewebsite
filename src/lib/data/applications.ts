import { createClient } from '@/lib/supabase/server';
import type { EmployerJob, EmployerProfile, JobApplication } from '@/lib/types';

export interface ApplicationCounts {
  total: number;
  new: number;
}

/**
 * Returns application counts keyed by job id for the signed-in employer.
 * Filtered by employer explicitly: RLS also lets applicants read their own
 * rows, so "everything visible" is no longer "everything for my jobs".
 */
export async function getApplicationCountsByJob(): Promise<
  Record<string, ApplicationCounts>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!employer) return {};

  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id, status')
    .eq('employer_id', employer.id);

  if (error || !data) return {};

  const counts: Record<string, ApplicationCounts> = {};
  for (const row of data as Pick<JobApplication, 'job_id' | 'status'>[]) {
    const bucket = (counts[row.job_id] ??= { total: 0, new: 0 });
    bucket.total += 1;
    if (row.status === 'new') bucket.new += 1;
  }
  return counts;
}

export interface JobWithApplications {
  job: EmployerJob;
  employer: EmployerProfile;
  applications: JobApplication[];
}

/**
 * Loads a single owned job plus its applications. Returns null when the job
 * doesn't exist or isn't owned by the current user.
 */
export async function getJobApplications(
  jobId: string
): Promise<JobWithApplications | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!employerProfile) return null;
  const employer = employerProfile as EmployerProfile;

  const { data: job } = await supabase
    .from('employer_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('employer_id', employer.id)
    .single();

  if (!job) return null;

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  return {
    job: job as EmployerJob,
    employer,
    applications: (applications || []) as JobApplication[],
  };
}

export interface MyApplication {
  id: string;
  created_at: string;
  /** Collapsed for the applicant: employer pipeline stages stay private. */
  seen: boolean;
  job: { title: string; slug: string; open: boolean; company: string | null } | null;
}

/**
 * Applications the signed-in job seeker sent while logged in. Returns null
 * when the query fails, so the page can say so instead of showing "none yet".
 */
export async function getMyApplications(limit?: number): Promise<MyApplication[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('job_applications')
    .select('id, created_at, status, job_id')
    .eq('applicant_user_id', user.id)
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('[applications] could not load applicant history:', error.message);
    return null;
  }
  if (!data || data.length === 0) return [];

  // Jobs are read through the service role: RLS hides inactive listings, but
  // the applicant should still see the title of a role that has since closed.
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  const jobIds = [...new Set(data.map((row) => row.job_id as string))];
  const { data: jobs } = await admin
    .from('employer_jobs')
    .select('id, title, slug, is_active, expires_at, employer:employer_profiles(company_name)')
    .in('id', jobIds);

  const jobsById = new Map(
    (jobs ?? []).map((job) => {
      const employer = Array.isArray(job.employer) ? job.employer[0] : job.employer;
      const expired = job.expires_at ? new Date(job.expires_at).getTime() < Date.now() : false;
      return [
        job.id as string,
        {
          title: job.title as string,
          slug: job.slug as string,
          open: Boolean(job.is_active) && !expired,
          company: (employer as { company_name?: string } | null)?.company_name ?? null,
        },
      ];
    }),
  );

  return data.map((row) => ({
    id: row.id as string,
    created_at: row.created_at as string,
    seen: row.status !== 'new',
    job: jobsById.get(row.job_id as string) ?? null,
  }));
}

export interface EmployerApplication extends JobApplication {
  job: { id: string; title: string; slug: string };
}

/** Every application across the signed-in employer's jobs, newest first. */
export async function getEmployerApplications(status?: JobApplication['status']): Promise<EmployerApplication[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: employer } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!employer) return [];

  let query = supabase
    .from('job_applications')
    .select('*, job:employer_jobs(id, title, slug)')
    .eq('employer_id', employer.id)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('[applications] could not load inbox:', error.message);
    return null;
  }
  return (data ?? []).map((row) => ({
    ...(row as JobApplication),
    job: (Array.isArray(row.job) ? row.job[0] : row.job) as EmployerApplication['job'],
  }));
}
