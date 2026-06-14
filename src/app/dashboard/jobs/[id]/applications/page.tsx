import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJobApplications } from '@/lib/data/applications';
import { StatusSelect, DownloadCvButton } from './ApplicationActions';

export const metadata = {
  title: 'Applications - Nuclear Hustle',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function JobApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getJobApplications(id);

  if (!data) notFound();

  const { job, applications } = data;
  const newCount = applications.filter((a) => a.status === 'new').length;

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/jobs"
        className="font-mono text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900"
      >
        &larr; Back to jobs
      </Link>

      <div className="mt-3 mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
          Applications
        </p>
        <h1 className="text-2xl font-bold text-stone-900 mt-1">{job.title}</h1>
        <p className="font-mono text-sm text-stone-500 mt-2">
          {applications.length} total
          {newCount > 0 && (
            <span className="text-yellow-700"> · {newCount} new</span>
          )}
          <span className="text-stone-400"> · {job.view_count} views</span>
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-[#EDE8DF] border border-[#CFC8BC] p-8 text-center">
          <p className="text-stone-600 font-mono text-sm">
            No applications yet. Share your listing to start receiving them.
          </p>
          <Link
            href={`/job/${job.slug}`}
            target="_blank"
            className="inline-block mt-4 font-mono text-xs uppercase tracking-widest border border-stone-900 px-3 py-1.5 hover:bg-stone-900 hover:text-[#EDE8DF] transition-colors"
          >
            View public listing
          </Link>
        </div>
      ) : (
        <div className="bg-[#EDE8DF] border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
          {applications.map((app) => (
            <div key={app.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{app.applicant_name}</p>
                  <a
                    href={`mailto:${app.applicant_email}`}
                    className="font-mono text-sm text-yellow-700 hover:underline break-all"
                  >
                    {app.applicant_email}
                  </a>
                  <p className="font-mono text-xs text-stone-400 mt-1">
                    Applied {formatDate(app.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <StatusSelect applicationId={app.id} status={app.status} />
                  <DownloadCvButton applicationId={app.id} hasCv={!!app.cv_path} />
                </div>
              </div>

              {app.message && (
                <div className="mt-3 border-t border-[#CFC8BC] pt-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-stone-400 mb-1">
                    Cover note
                  </p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {app.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
