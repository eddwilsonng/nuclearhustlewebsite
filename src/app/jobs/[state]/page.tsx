import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getJobsByState, getAllStateSlugs, getActiveCategoriesByState, getActiveStates, toJobListItem } from '@/lib/data/static';
import { getStateBySlug } from '@/lib/states';
import { PaginatedJobResults } from '@/components/PaginatedJobResults';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
  BrowseAlertLink,
} from '@/components/BrowsePageHeader';
import { buildJobsPaginationMetadata } from '@/lib/jobs/paginationMetadata';
import { getTotalPages, parsePageParam, buildJobsPageUrl } from '@/lib/jobs/pagination';

interface PageProps {
  params: Promise<{ state: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllStateSlugs();
  return slugs.map((state) => ({ state }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { state } = await params;
  const { page: pageParam } = await searchParams;
  const stateInfo = getStateBySlug(state);

  if (!stateInfo) return { title: 'State Not Found | Nuclear Hustle' };

  const jobs = getJobsByState(state);
  const basePath = `/jobs/${state}`;

  return buildJobsPaginationMetadata({
    pageParam,
    totalJobs: jobs.length,
    basePath,
    page1Title: `${stateInfo.name} Nuclear Jobs — ${jobs.length} Positions | Nuclear Hustle`,
    page1Description: `Browse ${jobs.length} nuclear jobs in ${stateInfo.name}. Reactor operator, engineering, and health physics roles at top operators.`,
    pagedTitle: (page, totalPages) =>
      `${stateInfo.name} Nuclear Jobs — Page ${page} of ${totalPages} | Nuclear Hustle`,
    pagedDescription: (page, totalPages, totalJobs) =>
      `Page ${page} of ${totalPages} — ${totalJobs} nuclear jobs in ${stateInfo.name}.`,
  });
}

export default async function StatePage({ params, searchParams }: PageProps) {
  const { state } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const stateInfo = getStateBySlug(state);

  if (!stateInfo) notFound();

  const jobs = getJobsByState(state);
  const jobListItems = jobs.map(toJobListItem);
  const basePath = `/jobs/${state}`;
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages) {
    redirect(buildJobsPageUrl(basePath, totalPages));
  }
  // Role chips show in-state counts and deep-link to the state×role page, so
  // the number on the chip matches what you see after clicking.
  const categories = getActiveCategoriesByState(state);

  // Build sidebar: other states with job counts, sorted by count desc
  const allActiveStates = getActiveStates()
    .filter(({ state: s }) => s.slug !== state)
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-[#EDE8DF]">

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbCurrent>{stateInfo.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Location</BrowseLabel>
        <BrowseTitle>Nuclear jobs in {stateInfo.name}</BrowseTitle>

        <div className="flex flex-wrap items-center gap-4">
          <BrowseMeta>
            <strong>{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}
            {totalPages > 1 && (
              <>
                <span className="text-stone-500 mx-2">//</span>
                <span>Page {page} of {totalPages}</span>
              </>
            )}
          </BrowseMeta>
          {jobs.length > 0 && (
            <BrowseAlertLink href="/signup">
              ★ Get {stateInfo.name} job alerts →
            </BrowseAlertLink>
          )}
        </div>
      </BrowsePageHeader>

      {/* Role filter bar */}
      <div className="border-b border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs tracking-widest uppercase text-stone-500 mr-1">Browse by role</span>
          {categories.map(({ category, name, count }) => (
            <Link
              key={category}
              href={`/jobs/${state}/${category}`}
              className="font-mono text-xs tracking-widest uppercase border border-[#CFC8BC] px-3 py-1 text-stone-500 hover:border-yellow-400 hover:text-stone-900 transition-colors"
            >
              {name}
              <span className="ml-1.5 text-stone-400">{count}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Job list */}
          <div className="lg:col-span-3">
            {jobs.length > 0 ? (
              <Suspense
                fallback={
                  <div className="border border-[#CFC8BC] p-10 text-center">
                    <p className="font-mono text-xs tracking-widest uppercase text-stone-400">Loading jobs…</p>
                  </div>
                }
              >
                <PaginatedJobResults
                  jobs={jobListItems}
                  initialPage={page}
                  basePath={basePath}
                />
              </Suspense>
            ) : (
              <div className="border border-[#CFC8BC] p-10 text-center">
                <p className="font-mono text-sm text-stone-400 mb-2">
                  No jobs currently listed in {stateInfo.name}.
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
                Be first to hear about new nuclear roles in {stateInfo.name}.
              </p>
              <Link
                href="/signup"
                className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
              >
                Create free alert →
              </Link>
            </div>

            {/* Other states */}
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">Other states</p>
              <ul className="space-y-2 border border-[#CFC8BC]">
                {allActiveStates.map(({ state: otherState, count }) => (
                  <li key={otherState.slug} className="border-b border-[#CFC8BC] last:border-b-0">
                    <Link
                      href={`/jobs/${otherState.slug}`}
                      className="flex items-center justify-between px-3 py-2 font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-[#E5DFD5] transition-colors"
                    >
                      <span>{otherState.name}</span>
                      <span className="text-stone-400">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/jobs"
                className="block font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors mt-3"
              >
                All locations →
              </Link>
            </div>

            {/* Employer nudge */}
            <div className="border border-[#CFC8BC] p-5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">Hiring in {stateInfo.name}?</p>
              <p className="font-mono text-xs text-stone-500 leading-relaxed mb-4">
                Post a role and reach nuclear professionals actively looking.
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
