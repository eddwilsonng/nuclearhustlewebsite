import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import {
  getJobsByStateAndCategory,
  getActiveCategoriesByState,
  getActiveStateCategoryCombos,
  getCompanies,
  toJobListItem,
} from '@/lib/data/static';
import { getStateBySlug } from '@/lib/states';
import { getCategoryInfo, getAllCategories, JobCategory } from '@/lib/categorize';
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
import { generateCategoryPageSchema, generateBreadcrumbSchema } from '@/lib/seo/schema';
import { buildJobsPaginationMetadata } from '@/lib/jobs/paginationMetadata';
import { getTotalPages, parsePageParam, buildJobsPageUrl } from '@/lib/jobs/pagination';

interface PageProps {
  params: Promise<{ state: string; category: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Statically generate only the state×category pairs that have live jobs. Any
// other valid pair still resolves on demand and is noindexed (zero listings).
export function generateStaticParams() {
  return getActiveStateCategoryCombos().map(({ stateSlug, category }) => ({
    state: stateSlug,
    category,
  }));
}

function isValidPair(state: string, category: string): boolean {
  if (!getStateBySlug(state)) return false;
  return category !== 'other' && getAllCategories().includes(category as JobCategory);
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { state, category } = await params;
  const { page: pageParam } = await searchParams;

  if (!isValidPair(state, category)) return { title: 'Not Found | Nuclear Hustle' };

  const stateInfo = getStateBySlug(state)!;
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const jobs = getJobsByStateAndCategory(state, category as JobCategory);
  const basePath = `/jobs/${state}/${category}`;

  return buildJobsPaginationMetadata({
    pageParam,
    totalJobs: jobs.length,
    basePath,
    page1Title: `Nuclear ${categoryInfo.name} Jobs in ${stateInfo.name} — ${jobs.length} Positions | Nuclear Hustle`,
    page1Description: `Browse ${jobs.length} nuclear ${categoryInfo.name.toLowerCase()} jobs in ${stateInfo.name}. ${categoryInfo.description}`.slice(0, 155),
    pagedTitle: (page, totalPages) =>
      `Nuclear ${categoryInfo.name} Jobs in ${stateInfo.name} — Page ${page} of ${totalPages} | Nuclear Hustle`,
    pagedDescription: (page, totalPages, totalJobs) =>
      `Page ${page} of ${totalPages} — ${totalJobs} nuclear ${categoryInfo.name.toLowerCase()} jobs in ${stateInfo.name}.`,
  });
}

export default async function StateCategoryPage({ params, searchParams }: PageProps) {
  const { state, category } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  if (!isValidPair(state, category)) notFound();

  const stateInfo = getStateBySlug(state)!;
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const jobs = getJobsByStateAndCategory(state, category as JobCategory);
  const jobListItems = jobs.map(toJobListItem);
  const basePath = `/jobs/${state}/${category}`;
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages && totalPages > 0) {
    redirect(buildJobsPageUrl(basePath, totalPages));
  }

  // Sidebar cross-links: other roles in this state, and this role in other states.
  const otherRolesInState = getActiveCategoriesByState(state).filter(
    (c) => c.category !== category
  );
  const sameRoleOtherStates = getActiveStateCategoryCombos()
    .filter((c) => c.category === category && c.stateSlug !== state)
    .map((c) => ({ ...c, state: getStateBySlug(c.stateSlug) }))
    .filter((c) => c.state)
    .slice(0, 10);

  const companies = getCompanies();
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));
  const url = `https://www.nuclearhustle.com${basePath}`;
  const schemaData = generateCategoryPageSchema({
    categoryName: `${categoryInfo.name} in ${stateInfo.name}`,
    categoryDescription: `Nuclear ${categoryInfo.name.toLowerCase()} jobs in ${stateInfo.name}. ${categoryInfo.description}`,
    jobCount: jobs.length,
    jobs: jobs.slice(0, 50),
    companies: companyMap,
    states: [stateInfo.name],
    url,
  });

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.nuclearhustle.com/' },
    { name: 'Jobs', url: 'https://www.nuclearhustle.com/jobs' },
    { name: `${stateInfo.name} Jobs`, url: `https://www.nuclearhustle.com/jobs/${state}` },
    { name: `${categoryInfo.name} Jobs in ${stateInfo.name}`, url },
  ]);

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      <Script
        id="state-category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbLink href={`/jobs/${state}`}>{stateInfo.name}</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbCurrent>{categoryInfo.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Role · Location</BrowseLabel>
        <BrowseTitle>
          Nuclear {categoryInfo.name} jobs in {stateInfo.name}
        </BrowseTitle>

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
              ★ Get {categoryInfo.name} alerts in {stateInfo.name} →
            </BrowseAlertLink>
          )}
        </div>
      </BrowsePageHeader>

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
                  hideCategory
                />
              </Suspense>
            ) : (
              <div className="border border-[#CFC8BC] p-10 text-center">
                <p className="font-mono text-sm text-stone-400 mb-2">
                  No {categoryInfo.name.toLowerCase()} jobs currently listed in {stateInfo.name}.
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
                    href={`/jobs/${state}`}
                    className="font-mono text-xs tracking-widest uppercase px-5 py-3 border border-[#CFC8BC] text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                  >
                    All {stateInfo.name} jobs →
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
                Be first to hear about new {categoryInfo.name.toLowerCase()} roles in {stateInfo.name}.
              </p>
              <Link
                href="/signup"
                className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
              >
                Create free alert →
              </Link>
            </div>

            {/* Other roles in this state */}
            {otherRolesInState.length > 0 && (
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">
                  Other roles in {stateInfo.name}
                </p>
                <ul className="border border-[#CFC8BC]">
                  {otherRolesInState.map(({ category: cat, name, count }) => (
                    <li key={cat} className="border-b border-[#CFC8BC] last:border-b-0">
                      <Link
                        href={`/jobs/${state}/${cat}`}
                        className="flex items-center justify-between px-3 py-2 font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-[#E5DFD5] transition-colors"
                      >
                        <span>{name}</span>
                        <span className="text-stone-400">{count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/jobs/${state}`}
                  className="block font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors mt-3"
                >
                  All {stateInfo.name} jobs →
                </Link>
              </div>
            )}

            {/* This role in other states */}
            {sameRoleOtherStates.length > 0 && (
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">
                  {categoryInfo.name} in other states
                </p>
                <ul className="border border-[#CFC8BC]">
                  {sameRoleOtherStates.map(({ stateSlug, state: s, count }) => (
                    <li key={stateSlug} className="border-b border-[#CFC8BC] last:border-b-0">
                      <Link
                        href={`/jobs/${stateSlug}/${category}`}
                        className="flex items-center justify-between px-3 py-2 font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-[#E5DFD5] transition-colors"
                      >
                        <span>{s!.name}</span>
                        <span className="text-stone-400">{count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/jobs/role/${category}`}
                  className="block font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors mt-3"
                >
                  All {categoryInfo.name.toLowerCase()} jobs →
                </Link>
              </div>
            )}

            {/* Employer nudge */}
            <div className="border border-[#CFC8BC] p-5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                Hiring in {stateInfo.name}?
              </p>
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
