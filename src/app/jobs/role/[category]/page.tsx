import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJobsByCategory, getActiveStates, getActiveCategories } from '@/lib/data';
import { getCategoryInfo, getAllCategories, JobCategory } from '@/lib/categorize';
import { JobCard } from '@/components/JobCard';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = getCategoryInfo(category as JobCategory);

  if (categoryInfo.id === 'other' && category !== 'other') {
    return { title: 'Category Not Found | Nuclear Hustle' };
  }

  const jobs = getJobsByCategory(category as JobCategory);
  const title = `Nuclear ${categoryInfo.name} Jobs - ${jobs.length} Positions | Nuclear Hustle`;
  const description = `Browse ${jobs.length} nuclear ${categoryInfo.name.toLowerCase()} jobs across the US. ${categoryInfo.description}`;

  return { title, description, openGraph: { title, description, type: 'website' } };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const allCategories = getAllCategories();

  if (!allCategories.includes(category as JobCategory)) notFound();

  const jobs = getJobsByCategory(category as JobCategory);
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();

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
            <span className="text-gray-900">{categoryInfo.name}</span>
          </nav>
          <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">Role</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Nuclear {categoryInfo.name} jobs
          </h1>
          <p className="font-mono text-sm text-gray-400 mb-2">
            <strong className="text-gray-900">{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}
          </p>
          <p className="font-mono text-sm text-gray-400 max-w-xl">{categoryInfo.description}</p>
        </div>
      </div>

      {/* State filter */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest uppercase text-gray-300">State</span>
          {activeStates.slice(0, 6).map(({ state }) => (
            <Link
              key={state.slug}
              href={`/jobs/${state.slug}`}
              className="font-mono text-xs tracking-widest uppercase border border-gray-100 px-3 py-1 text-gray-500 hover:border-yellow-400 hover:text-gray-900 transition-colors"
            >
              {state.name}
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
                <p className="font-mono text-sm text-gray-400 mb-4">No {categoryInfo.name.toLowerCase()} jobs currently available.</p>
                <Link href="/jobs" className="font-mono text-xs tracking-widest uppercase text-yellow-600 hover:text-yellow-700 transition-colors">
                  Browse all jobs →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Other roles</p>
            <ul className="space-y-2">
              {activeCategories
                .filter((c) => c.category !== category)
                .map(({ category: cat, name, count }) => (
                  <li key={cat}>
                    <Link
                      href={`/jobs/role/${cat}`}
                      className="flex justify-between font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <span>{name}</span>
                      <span className="text-gray-300">{count}</span>
                    </Link>
                  </li>
                ))}
            </ul>
            <Link
              href="/jobs"
              className="block font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors mt-6"
            >
              All jobs →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
