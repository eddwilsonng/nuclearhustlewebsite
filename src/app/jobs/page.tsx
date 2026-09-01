import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getJobsForList, getActiveStates, getActiveCategories, getCompanies } from '@/lib/data/static';
import { JobList } from '@/components/JobList';
import {
  BrowsePageHeader,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
} from '@/components/BrowsePageHeader';
import { FilterChip } from '@/components/FilterChip';
import { buildJobsPaginationMetadata } from '@/lib/jobs/paginationMetadata';
import { getTotalPages, parsePageParam, buildJobsPageUrl } from '@/lib/jobs/pagination';

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; company?: string; role?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const jobs = getJobsForList();

  return buildJobsPaginationMetadata({
    pageParam,
    totalJobs: jobs.length,
    basePath: '/jobs',
    page1Title: 'All Nuclear Jobs - Browse Open Positions | Nuclear Hustle',
    page1Description:
      'Browse all nuclear power plant jobs across the United States. Find reactor operator, engineering, maintenance, and health physics positions.',
    pagedTitle: (page, totalPages) =>
      `Nuclear Jobs — Page ${page} of ${totalPages} | Nuclear Hustle`,
    pagedDescription: (page, totalPages, totalJobs) =>
      `Page ${page} of ${totalPages} — browse ${totalJobs} nuclear power plant jobs across the United States.`,
  });
}

function JobListFallback() {
  return (
        <div className="border border-rule p-10 text-center">
          <p className="font-sans text-sm text-secondary">Loading jobs…</p>
        </div>
  );
}

export default async function JobsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const jobs = getJobsForList();
  const companies = getCompanies();
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages) {
    redirect(buildJobsPageUrl('/jobs', totalPages));
  }

  return (
    <div className="min-h-screen bg-canvas">
      <BrowsePageHeader>
        <BrowseLabel>Jobs</BrowseLabel>
        <BrowseTitle>All Nuclear Jobs</BrowseTitle>
        <BrowseMeta>
          <strong>{jobs.length}</strong> open positions
          <span className="text-muted mx-2" aria-hidden="true">/</span>
          <strong>{companies.length}</strong> companies
          {totalPages > 1 && (
            <>
              <span className="text-muted mx-2" aria-hidden="true">/</span>
              <span>Page {page} of {totalPages}</span>
            </>
          )}
        </BrowseMeta>
      </BrowsePageHeader>

      <div className="border-b border-rule">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-secondary">State</span>
              {activeStates.slice(0, 5).map(({ state, count }) => (
                <FilterChip key={state.slug} href={`/jobs/${state.slug}`} count={count}>
                  {state.name}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-secondary">Role</span>
              {activeCategories
                .filter(({ category }) => category !== 'other')
                .map(({ category, name, count }) => (
                <FilterChip key={category} href={`/jobs/role/${category}`} count={count}>
                  {name}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Job list */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Suspense fallback={<JobListFallback />}>
          <JobList jobs={jobs} companies={companies} initialPage={page} />
        </Suspense>
      </div>
    </div>
  );
}
