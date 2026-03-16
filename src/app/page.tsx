import { Metadata } from 'next';
import Link from 'next/link';
import { getJobsWithCompany, getCompanies, getActiveStates, getActiveCategories } from '@/lib/data';
import { JobCard } from '@/components/JobCard';

export const metadata: Metadata = {
  title: 'Nuclear Hustle - Nuclear Power Plant Jobs in the US',
  description: 'Find nuclear power plant jobs across the United States. Browse reactor operator, engineering, maintenance, and health physics positions at top nuclear operators.',
  keywords: ['nuclear jobs', 'nuclear power plant jobs', 'reactor operator jobs', 'nuclear engineer jobs', 'nuclear careers'],
};

export default function Home() {
  const jobs = getJobsWithCompany();
  const companies = getCompanies();
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();
  const recentJobs = jobs.slice(0, 20);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="font-mono text-4xl md:text-6xl font-bold text-gray-900 leading-tight max-w-3xl">
            The job board for{' '}
            <span className="text-yellow-500">nuclear energy</span>{' '}
            professionals.
          </h1>
          <p className="mt-6 text-gray-500 text-lg max-w-xl">
            Connecting nuclear professionals with opportunities at power plants
            across the United States. Updated daily from top operators.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold transition-colors"
            >
              Browse All Jobs
            </Link>
            <Link
              href="/companies"
              className="font-mono text-xs tracking-widest uppercase px-6 py-3 border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 transition-colors"
            >
              View Companies
            </Link>
          </div>

          {/* Inline stats */}
          <div className="mt-12 flex flex-wrap items-center gap-2 font-mono text-sm text-gray-400">
            <span><strong className="text-gray-900">{jobs.length}</strong> jobs</span>
            <span className="text-gray-200 mx-1">//</span>
            <span><strong className="text-gray-900">{companies.length}</strong> companies</span>
            <span className="text-gray-200 mx-1">//</span>
            <span><strong className="text-gray-900">{activeStates.length}</strong> states</span>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <span className="font-mono text-sm text-gray-200">//</span>
      </div>

      {/* Latest Jobs */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">01</p>
              <h2 className="font-mono text-2xl font-bold text-gray-900">Latest listings</h2>
            </div>
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors"
            >
              All {jobs.length} jobs →
            </Link>
          </div>

          <div className="border border-gray-100">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <span className="font-mono text-sm text-gray-200">//</span>
      </div>

      {/* Browse by Role */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">02</p>
          <h2 className="font-mono text-2xl font-bold text-gray-900 mb-8">Browse by role</h2>
          <div className="flex flex-wrap gap-3">
            {activeCategories.map(({ category, name, count }) => (
              <Link
                key={category}
                href={`/jobs/role/${category}`}
                className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-gray-900 transition-colors"
              >
                {name}
                <span className="ml-2 text-gray-300">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <span className="font-mono text-sm text-gray-200">//</span>
      </div>

      {/* Browse by State */}
      <section className="py-16 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">03</p>
          <h2 className="font-mono text-2xl font-bold text-gray-900 mb-8">Browse by state</h2>
          <div className="flex flex-wrap gap-3">
            {activeStates.slice(0, 12).map(({ state, count }) => (
              <Link
                key={state.slug}
                href={`/jobs/${state.slug}`}
                className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-gray-900 transition-colors"
              >
                {state.name}
                <span className="ml-2 text-gray-300">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4">
            The nuclear energy workforce is growing.
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-gray-900 mb-8 max-w-2xl">
            New reactors are being built. Existing plants are extending operations.
          </h2>
          <Link
            href="/signup"
            className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold transition-colors inline-block"
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-300 text-sm select-none">##</span>
            <span className="font-mono text-xs tracking-widest uppercase text-gray-400">nuclearhustle</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-xs tracking-widest uppercase text-gray-400">
            <Link href="/jobs" className="hover:text-gray-900 transition-colors">Jobs</Link>
            <Link href="/companies" className="hover:text-gray-900 transition-colors">Companies</Link>
          </div>
          <p className="font-mono text-xs text-gray-300" suppressHydrationWarning>
            © {new Date().getFullYear()} nuclearhustle.com
          </p>
        </div>
      </footer>
    </div>
  );
}
