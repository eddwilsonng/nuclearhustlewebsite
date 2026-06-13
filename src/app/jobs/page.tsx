import { Metadata } from 'next';
import Link from 'next/link';
import { getJobsForList, getActiveStates, getActiveCategories, getCompanies } from '@/lib/data/static';
import { JobList } from '@/components/JobList';

export const metadata: Metadata = {
  title: 'All Nuclear Jobs - Browse Open Positions | Nuclear Hustle',
  description: 'Browse all nuclear power plant jobs across the United States. Find reactor operator, engineering, maintenance, and health physics positions.',
  alternates: { canonical: 'https://nuclearhustle.com/jobs' },
};

export default function JobsPage() {
  const jobs = getJobsForList();
  const companies = getCompanies();
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      {/* Header */}
      <div className="border-b border-[#CFC8BC] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-2">Jobs</p>
          <h1 className="font-mono text-3xl font-bold text-stone-900 mb-3">All Nuclear Jobs</h1>
          <p className="font-mono text-sm text-stone-500">
            <strong className="text-stone-900">{jobs.length}</strong> open positions
            <span className="text-stone-400 mx-2">//</span>
            <strong className="text-stone-900">{companies.length}</strong> companies
          </p>
        </div>
      </div>

      {/* Quick filters */}
      <div className="border-b border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-stone-400">State</span>
              {activeStates.slice(0, 5).map(({ state, count }) => (
                <Link
                  key={state.slug}
                  href={`/jobs/${state.slug}`}
                  className="font-mono text-xs tracking-widest uppercase border border-[#CFC8BC] px-3 py-1 text-stone-500 hover:border-yellow-400 hover:text-stone-900 transition-colors"
                >
                  {state.name} <span className="text-stone-400">{count}</span>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-stone-400">Role</span>
              {activeCategories.slice(0, 4).map(({ category, name, count }) => (
                <Link
                  key={category}
                  href={`/jobs/role/${category}`}
                  className="font-mono text-xs tracking-widest uppercase border border-[#CFC8BC] px-3 py-1 text-stone-500 hover:border-yellow-400 hover:text-stone-900 transition-colors"
                >
                  {name} <span className="text-stone-400">{count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Job list */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <JobList jobs={jobs} companies={companies} />
      </main>
    </div>
  );
}
