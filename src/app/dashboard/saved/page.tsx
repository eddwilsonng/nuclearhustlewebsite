import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getAnyJobBySlug } from '@/lib/data/employer';
import { toJobListItem } from '@/lib/data/static';
import { JobCard } from '@/components/JobCard';

export const metadata = {
  title: 'Saved Jobs - Nuclear Hustle',
};

export default async function SavedJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: savedRows } = await supabase
    .from('saved_jobs')
    .select('job_slug, saved_at')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false });

  const jobs = (
    await Promise.all(
      (savedRows ?? []).map(async (row) => {
        const job = await getAnyJobBySlug(row.job_slug);
        return job ? toJobListItem(job) : null;
      })
    )
  ).filter((job) => job !== null);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Saved Jobs</h1>

      {jobs.length === 0 ? (
        <div className="bg-[#EDE8DF] rounded-lg border border-[#CFC8BC] p-8 text-center">
          <p className="text-stone-600 mb-4">You haven&apos;t saved any jobs yet.</p>
          <Link
            href="/jobs"
            className="inline-block py-2 px-4 bg-yellow-500 hover:bg-yellow-400 text-stone-900 font-semibold rounded-md transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="border border-[#CFC8BC] rounded-lg overflow-hidden">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isAuthenticated initialSaved />
          ))}
        </div>
      )}
    </div>
  );
}
