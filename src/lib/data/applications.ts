import { createClient } from '@/lib/supabase/server';
import type { EmployerJob, EmployerProfile, JobApplication } from '@/lib/types';

export interface ApplicationCounts {
  total: number;
  new: number;
}

/**
 * Returns application counts keyed by job id for the signed-in employer.
 * RLS guarantees only the employer's own applications are visible.
 */
export async function getApplicationCountsByJob(): Promise<
  Record<string, ApplicationCounts>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id, status');

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
