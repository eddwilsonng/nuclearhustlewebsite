import { getFeaturedJobs } from '@/lib/data/employer';
import { JobCard } from '@/components/JobCard';
import { LinkButton } from '@/components/ui/LinkButton';

export async function FeaturedJobsSection({ postHref = '/signup/employer' }: { postHref?: string }) {
  const featuredJobs = await getFeaturedJobs();

  return (
    <>
      {featuredJobs.length > 0 ? (
        <div className="border border-signal">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-rule p-10 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-secondary">
            No featured listings yet
          </p>
          <p className="mx-auto mb-6 max-w-sm font-sans text-sm text-secondary">
            Get your role in front of thousands of nuclear professionals. Featured listings appear at the top of the board.
          </p>
          <LinkButton href={postHref} variant="primary">
            Post a featured job
          </LinkButton>
        </div>
      )}
    </>
  );
}

export function FeaturedJobsSkeleton() {
  return (
    <div className="border border-dashed border-rule p-10 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-secondary">
        Loading featured listings…
      </p>
    </div>
  );
}
