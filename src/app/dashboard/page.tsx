import Link from 'next/link';
import { cookies } from 'next/headers';
import { Search, FileText, Heart, Check, X as XIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from '@/lib/admin';
import { getStateByCode } from '@/lib/states';
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
  let viewRole: AdminViewRole = typedProfile.role as AdminViewRole;

  if (isAdmin(user.email)) {
    const cookieStore = await cookies();
    const override = cookieStore.get(ADMIN_VIEW_COOKIE)?.value as AdminViewRole | undefined;
    if (override === 'employer' || override === 'job_seeker') {
      viewRole = override;
    }
  }

  if (viewRole === 'employer') {
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
  const isActivelyLooking = typedJobSeekerProfile?.is_actively_looking ?? true;
  const stateName = typedJobSeekerProfile?.state ? getStateByCode(typedJobSeekerProfile.state)?.name : null;

  const statusRows = [
    { label: 'Full Name', complete: true },
    { label: 'City & State', complete: !!(typedJobSeekerProfile?.location || stateName) },
    { label: 'Phone', complete: !!typedJobSeekerProfile?.phone },
    { label: 'Resume', complete: !!typedJobSeekerProfile?.resume_url },
  ];

  const quickActions = [
    { href: '/jobs', label: 'Browse Jobs', description: 'Find your next opportunity', Icon: Search },
    { href: '/dashboard/profile', label: 'Upload Resume', description: 'Keep your resume up to date', Icon: FileText },
    { href: '/dashboard/saved', label: 'Saved Jobs', description: "Jobs you've bookmarked", Icon: Heart },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-mono text-2xl font-bold text-stone-900">
          Welcome back, {profile.full_name.split(' ')[0]}!
        </h1>
        <span
          className={`font-mono text-[10px] tracking-widest uppercase border px-2 py-0.5 ${
            isActivelyLooking
              ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
              : 'border-[#CFC8BC] text-stone-400'
          }`}
        >
          {isActivelyLooking ? 'Open to opportunities' : 'Not looking'}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Completeness */}
        <div className="bg-[#EDE8DF] border border-[#CFC8BC] p-6">
          <h2 className="font-mono text-sm font-bold tracking-widest uppercase text-stone-900 mb-4">Profile Status</h2>
          <div className="space-y-3">
            {statusRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="font-mono text-xs text-stone-600">{row.label}</span>
                <span className={row.complete ? 'text-green-600' : 'text-stone-300'}>
                  {row.complete ? <Check size={16} /> : <XIcon size={16} />}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/profile"
            className="mt-4 block text-center py-2 px-4 border border-[#CFC8BC] bg-[#E5DFD5] hover:bg-[#CFC8BC] font-mono text-xs tracking-widest uppercase text-stone-700 transition-colors"
          >
            Complete Profile
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#EDE8DF] border border-[#CFC8BC] p-6">
          <h2 className="font-mono text-sm font-bold tracking-widest uppercase text-stone-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map(({ href, label, description, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 hover:bg-[#E5DFD5] transition-colors"
              >
                <div className="w-10 h-10 border border-[#CFC8BC] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-stone-600" />
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-stone-900">{label}</p>
                  <p className="font-mono text-xs text-stone-500">{description}</p>
                </div>
              </Link>
            ))}
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
