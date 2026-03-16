import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { JobStatusToggle, DeleteJobButton } from './JobActions';
import type { EmployerProfile, EmployerJob } from '@/lib/types';

export const metadata = {
  title: 'Manage Jobs - Nuclear Hustle',
};

export default async function ManageJobsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Job Postings</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">No employer profile found.</p>
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

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
        <Link
          href="/dashboard/jobs/new"
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-md transition-colors"
        >
          Post New Job
        </Link>
      </div>

      {typedJobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <p className="text-gray-600 mb-4">You haven&apos;t posted any jobs yet.</p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-md transition-colors"
          >
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {typedJobs.map((job) => (
            <div key={job.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        job.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <JobStatusToggle jobId={job.id} isActive={job.is_active} />
                  <Link
                    href={`/dashboard/jobs/${job.id}/edit`}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/job/${job.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    View
                  </Link>
                  <DeleteJobButton jobId={job.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
