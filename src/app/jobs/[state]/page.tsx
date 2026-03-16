import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJobsByState, getAllStateSlugs, getActiveCategories } from '@/lib/data';
import { getStateBySlug } from '@/lib/states';
import { JobCard } from '@/components/JobCard';

interface PageProps {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllStateSlugs();
  return slugs.map((state) => ({ state }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const stateInfo = getStateBySlug(state);

  if (!stateInfo) return { title: 'State Not Found | Nuclear Hustle' };

  const jobs = getJobsByState(state);
  const title = `Nuclear Jobs in ${stateInfo.name} - ${jobs.length} Open Positions | Nuclear Hustle`;
  const description = `Find ${jobs.length} nuclear power plant jobs in ${stateInfo.name}. Browse reactor operator, engineering, maintenance, and health physics positions.`;

  return { title, description, openGraph: { title, description, type: 'website' } };
}

export default async function StatePage({ params }: PageProps) {
  const { state } = await params;
  const stateInfo = getStateBySlug(state);

  if (!stateInfo) notFound();

  const jobs = getJobsByState(state);
  const categories = getActiveCategories();

  const otherStatesWithJobs = getAllStateSlugs()
    .filter((s) => s !== state)
    .slice(0, 10)
    .map((s) => getStateBySlug(s)!)
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-200">//</span>
            <Link href="/jobs" className="hover:text-gray-900 transition-colors">Jobs</Link>
            <span className="text-gray-200">//</span>
            <span className="text-gray-900">{stateInfo.name}</span>
          </nav>
          <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">Location</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Nuclear jobs in {stateInfo.name}
          </h1>
          <p className="font-mono text-sm text-gray-400">
            <strong className="text-gray-900">{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Role filter */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest uppercase text-gray-300">Role</span>
          {categories.map(({ category, name }) => (
            <Link
              key={category}
              href={`/jobs/role/${category}`}
              className="font-mono text-xs tracking-widest uppercase border border-gray-100 px-3 py-1 text-gray-500 hover:border-yellow-400 hover:text-gray-900 transition-colors"
            >
              {name}
            </Link>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Job list */}
          <div className="lg:col-span-3">
            {jobs.length > 0 ? (
              <div className="border border-gray-100">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="border border-gray-100 p-8 text-center">
                <p className="font-mono text-sm text-gray-400 mb-4">No jobs currently available in {stateInfo.name}.</p>
                <Link href="/jobs" className="font-mono text-xs tracking-widest uppercase text-yellow-600 hover:text-yellow-700 transition-colors">
                  Browse all jobs →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Other states</p>
            <ul className="space-y-2">
              {otherStatesWithJobs.map((otherState) => (
                <li key={otherState.slug}>
                  <Link
                    href={`/jobs/${otherState.slug}`}
                    className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    {otherState.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/jobs"
              className="block font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors mt-6"
            >
              All locations →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
