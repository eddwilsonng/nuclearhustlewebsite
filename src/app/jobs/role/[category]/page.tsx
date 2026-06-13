import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJobsByCategory, getActiveStates, getActiveCategories } from '@/lib/data/static';
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
  const title = `Nuclear ${categoryInfo.name} Jobs — ${jobs.length} Positions | Nuclear Hustle`;
  const description = `Browse ${jobs.length} nuclear ${categoryInfo.name.toLowerCase()} jobs across the US. ${categoryInfo.description}`.slice(0, 155);

  const url = `https://nuclearhustle.com/jobs/role/${category}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'Nuclear Hustle' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const allCategories = getAllCategories();

  if (!allCategories.includes(category as JobCategory)) notFound();

  const jobs = getJobsByCategory(category as JobCategory);
  const activeStates = getActiveStates().slice(0, 8);
  // Exclude current category and 'other' from the sidebar list
  const activeCategories = getActiveCategories().filter(
    (c) => c.category !== category && c.category !== 'other'
  );

  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      {/* Header */}
      <div className="border-b border-[#CFC8BC] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-stone-400 mb-6">
            <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
            <span aria-hidden="true">//</span>
            <Link href="/jobs" className="hover:text-stone-900 transition-colors">Jobs</Link>
            <span aria-hidden="true">//</span>
            <span className="text-stone-900">{categoryInfo.name}</span>
          </nav>

          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Role</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            Nuclear {categoryInfo.name} jobs
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-3">
            <p className="font-mono text-sm text-stone-400">
              <strong className="text-stone-900">{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}
            </p>
            {jobs.length > 0 && (
              <Link
                href="/signup"
                className="font-mono text-xs tracking-widest uppercase text-yellow-700 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 transition-colors"
              >
                ★ Get {categoryInfo.name} job alerts →
              </Link>
            )}
          </div>

          {categoryInfo.description && (
            <p className="font-mono text-sm text-stone-400 max-w-xl">{categoryInfo.description}</p>
          )}
        </div>
      </div>

      {/* State filter bar */}
      <div className="border-b border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest uppercase text-stone-500 mr-1">Filter by state</span>
          {activeStates.map(({ state, count }) => (
            <Link
              key={state.slug}
              href={`/jobs/${state.slug}`}
              className="font-mono text-xs tracking-widest uppercase border border-[#CFC8BC] px-3 py-1 text-stone-500 hover:border-yellow-400 hover:text-stone-900 transition-colors"
            >
              {state.name}
              <span className="ml-1.5 text-stone-400">{count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Job list — category tag is hidden since we're already on this category's page */}
          <div className="lg:col-span-3">
            {jobs.length > 0 ? (
              <div className="border border-[#CFC8BC]">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} hideCategory />
                ))}
              </div>
            ) : (
              <div className="border border-[#CFC8BC] p-10 text-center">
                <p className="font-mono text-sm text-stone-400 mb-2">
                  No {categoryInfo.name.toLowerCase()} jobs currently listed.
                </p>
                <p className="font-mono text-xs text-stone-400 mb-6">
                  New roles are added daily — set up an alert so you don't miss one.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/signup"
                    className="font-mono text-xs tracking-widest uppercase px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
                  >
                    Get job alerts →
                  </Link>
                  <Link
                    href="/jobs"
                    className="font-mono text-xs tracking-widest uppercase px-5 py-3 border border-[#CFC8BC] text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                  >
                    Browse all jobs →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">

            {/* Job alert CTA */}
            <div className="border border-yellow-300 bg-yellow-50 p-5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-yellow-700 mb-2">Free job alerts</p>
              <p className="font-mono text-xs text-stone-600 leading-relaxed mb-4">
                Be first to hear about new {categoryInfo.name.toLowerCase()} roles.
              </p>
              <Link
                href="/signup"
                className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
              >
                Create free alert →
              </Link>
            </div>

            {/* Other roles */}
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">Other roles</p>
              <ul className="border border-[#CFC8BC]">
                {activeCategories.map(({ category: cat, name, count }) => (
                  <li key={cat} className="border-b border-[#CFC8BC] last:border-b-0">
                    <Link
                      href={`/jobs/role/${cat}`}
                      className="flex items-center justify-between px-3 py-2 font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-[#E5DFD5] transition-colors"
                    >
                      <span>{name}</span>
                      <span className="text-stone-400">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/jobs"
                className="block font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors mt-3"
              >
                All jobs →
              </Link>
            </div>

            {/* Employer nudge */}
            <div className="border border-[#CFC8BC] p-5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">Hiring?</p>
              <p className="font-mono text-xs text-stone-500 leading-relaxed mb-4">
                Post a {categoryInfo.name.toLowerCase()} role and reach qualified nuclear professionals.
              </p>
              <Link
                href="/signup/employer"
                className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors"
              >
                Post a job →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
