import Link from 'next/link';
import { getFeaturedJobs } from '@/lib/data/employer';
import { JobCard } from '@/components/JobCard';

export async function FeaturedJobsSection() {
  const featuredJobs = await getFeaturedJobs();

  return (
    <>
      {featuredJobs.length > 0 ? (
        <div className="border border-yellow-200">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[#CFC8BC] p-10 text-center">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-500 mb-3">No featured listings yet</p>
          <p className="text-stone-400 text-sm mb-6 max-w-sm mx-auto">
            Get your role in front of thousands of nuclear professionals. Featured listings appear at the top of the board.
          </p>
          <Link
            href="/signup/employer"
            className="font-mono text-xs tracking-widest uppercase px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors inline-block"
          >
            Post a featured job
          </Link>
        </div>
      )}
    </>
  );
}

export function FeaturedJobsSkeleton() {
  return (
    <div className="border border-dashed border-[#CFC8BC] p-10 text-center">
      <p className="font-mono text-xs tracking-widest uppercase text-stone-400">Loading featured listings…</p>
    </div>
  );
}
