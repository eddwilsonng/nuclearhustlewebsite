import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile, EmployerProfile, JobSeekerProfile, EmployerJob } from '@/lib/types';

export const metadata = {
  title: 'Dashboard - Nuclear Hustle',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const typedProfile = profile as Profile;

  if (typedProfile.role === 'employer') {
    return <EmployerDashboard userId={user.id} profile={typedProfile} />;
  }

  return <JobSeekerDashboard userId={user.id} profile={typedProfile} />;
}

async function JobSeekerDashboard({ userId, profile }: { userId: string; profile: Profile }) {
  const supabase = await createClient();

  const { data: jobSeekerProfile } = await supabase
    .from('job_seeker_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const typedJobSeekerProfile = jobSeekerProfile as JobSeekerProfile | null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Welcome back, {profile.full_name.split(' ')[0]}!
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Completeness */}
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Profile Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Full Name</span>
              <span className="text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Location</span>
              {typedJobSeekerProfile?.location ? (
                <span className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              ) : (
                <span className="text-yellow-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Resume</span>
              {typedJobSeekerProfile?.resume_url ? (
                <span className="text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              ) : (
                <span className="text-yellow-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="mt-4 block text-center py-2 px-4 bg-[#E5DFD5] hover:bg-[#CFC8BC] text-stone-700 font-medium rounded-md transition-colors"
          >
            Complete Profile
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/jobs"
              className="flex items-center gap-3 p-3 rounded-md hover:bg-[#E5DFD5] transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-stone-900">Browse Jobs</p>
                <p className="text-sm text-stone-500">Find your next opportunity</p>
              </div>
            </Link>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 p-3 rounded-md hover:bg-[#E5DFD5] transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-stone-900">Upload Resume</p>
                <p className="text-sm text-stone-500">Keep your resume up to date</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

async function EmployerDashboard({ userId, profile }: { userId: string; profile: Profile }) {
  const supabase = await createClient();

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const typedEmployerProfile = employerProfile as EmployerProfile | null;

  let jobs: EmployerJob[] = [];
  if (typedEmployerProfile) {
    const { data } = await supabase
      .from('employer_jobs')
      .select('*')
      .eq('employer_id', typedEmployerProfile.id)
      .order('created_at', { ascending: false });
    jobs = (data || []) as EmployerJob[];
  }

  const activeJobs = jobs.filter((j) => j.is_active).length;
  const totalJobs = jobs.length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">
        Welcome back, {profile.full_name.split(' ')[0]}!
      </h1>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
          <p className="text-sm text-stone-500">Active Jobs</p>
          <p className="text-3xl font-bold text-stone-900">{activeJobs}</p>
        </div>
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
          <p className="text-sm text-stone-500">Total Jobs Posted</p>
          <p className="text-3xl font-bold text-stone-900">{totalJobs}</p>
        </div>
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-6">
          <p className="text-sm text-stone-500">Company</p>
          <p className="text-lg font-semibold text-stone-900 truncate">
            {typedEmployerProfile?.company_name || 'Not set'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/jobs/new"
          className="bg-yellow-500 hover:bg-yellow-400 rounded-lg p-6 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Post a New Job</p>
              <p className="text-sm text-stone-400">Reach qualified candidates</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/jobs"
          className="bg-[#EDE8DF] hover:bg-[#E5DFD5] rounded-lg border border-[#CFC8BC] p-6 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#E5DFD5] rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-900">Manage Job Postings</p>
              <p className="text-sm text-stone-500">Edit or deactivate listings</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Recent Job Postings</h2>
          <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">{job.title}</p>
                  <p className="text-sm text-stone-500">{job.location}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      job.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[#E5DFD5] text-stone-600'
                    }`}
                  >
                    {job.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    href={`/dashboard/jobs/${job.id}/edit`}
                    className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
