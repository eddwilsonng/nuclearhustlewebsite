import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { JobStatusToggle, DeleteJobButton, FeatureJobButton, RenewJobButton } from './JobActions';
import { FeaturedSuccessBanner } from './FeaturedSuccessBanner';
import { getApplicationCountsByJob } from '@/lib/data/applications';
import type { EmployerProfile, EmployerJob } from '@/lib/types';

const EXPIRY_SOON_DAYS = 7;

function getExpiryState(expiresAt: string | null): {
  label: string;
  expired: boolean;
  soon: boolean;
} | null {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return { label: 'Expired', expired: true, soon: false };
  if (days <= EXPIRY_SOON_DAYS)
    return { label: `Expires in ${days}d`, expired: false, soon: true };
  return { label: `Expires ${new Date(expiresAt).toLocaleDateString()}`, expired: false, soon: false };
}

export const metadata = {
  title: 'Manage Jobs - Nuclear Hustle',
};

export default async function ManageJobsPage({ searchParams }: { searchParams: Promise<{ featured?: string }> }) {
  const params = await searchParams;
  const showFeaturedSuccess = params.featured === 'success';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!employerProfile) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Job Postings</h1>
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-8 text-center">
          <p className="text-stone-600">No employer profile found.</p>
        </div>
      </div>
    );
  }

  const typedEmployerProfile = employerProfile as EmployerProfile;

  const { data: jobs } = await supabase
    .from('employer_jobs')
    .select('*')
    .eq('employer_id', typedEmployerProfile.id)
    .order('created_at', { ascending: false });

  const typedJobs = (jobs || []) as EmployerJob[];
  const applicationCounts = await getApplicationCountsByJob();

  return (
    <div className="max-w-4xl">
      {showFeaturedSuccess && <FeaturedSuccessBanner />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Job Postings</h1>
        <Link
          href="/dashboard/jobs/new"
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-semibold rounded-md transition-colors text-center sm:text-left shrink-0"
        >
          Post New Job
        </Link>
      </div>

      {typedJobs.length === 0 ? (
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-stone-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-stone-600 mb-4">You haven&apos;t posted any jobs yet.</p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-semibold rounded-md transition-colors"
          >
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
          {typedJobs.map((job) => {
            const appCount = applicationCounts[job.id];
            const expiry = getExpiryState(job.expires_at);
            return (
            <div key={job.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-stone-900 truncate">{job.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        job.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[#E5DFD5] text-stone-600'
                      }`}
                    >
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {expiry && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          expiry.expired
                            ? 'bg-red-100 text-red-700'
                            : expiry.soon
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-[#E5DFD5] text-stone-500'
                        }`}
                      >
                        {expiry.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{job.location}</p>
                  <div className="flex items-center gap-3 mt-2 font-mono text-xs text-stone-400">
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{job.view_count} views</span>
                    <span>·</span>
                    <Link
                      href={`/dashboard/jobs/${job.id}/applications`}
                      className="text-stone-700 hover:text-stone-900 underline-offset-2 hover:underline"
                    >
                      {appCount?.total ?? 0} application{(appCount?.total ?? 0) === 1 ? '' : 's'}
                      {appCount?.new ? (
                        <span className="ml-1 inline-block bg-yellow-400 text-stone-900 px-1.5 py-0.5 rounded font-bold">
                          {appCount.new} new
                        </span>
                      ) : null}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {expiry?.expired && <RenewJobButton jobId={job.id} />}
                  <FeatureJobButton
                    jobId={job.id}
                    isFeatured={job.is_featured}
                    featuredUntil={job.featured_until}
                  />
                  <JobStatusToggle jobId={job.id} isActive={job.is_active} />
                  <Link
                    href={`/dashboard/jobs/${job.id}/applications`}
                    className="px-3 py-1.5 text-sm text-stone-700 hover:bg-[#E5DFD5] rounded-md transition-colors"
                  >
                    Applicants
                  </Link>
                  <Link
                    href={`/dashboard/jobs/${job.id}/edit`}
                    className="px-3 py-1.5 text-sm text-stone-700 hover:bg-[#E5DFD5] rounded-md transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/job/${job.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 text-sm text-stone-700 hover:bg-[#E5DFD5] rounded-md transition-colors"
                  >
                    View
                  </Link>
                  <DeleteJobButton jobId={job.id} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
