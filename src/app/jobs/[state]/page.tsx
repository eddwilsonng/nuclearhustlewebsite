import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { getJobsByState, getAllStateSlugs, getActiveCategoriesByState, getActiveStates, toJobListItem } from '@/lib/data/static';
import { getStateBySlug } from '@/lib/states';
import { PaginatedJobResults } from '@/components/PaginatedJobResults';
import { FilterChip } from '@/components/FilterChip';
import { JobAlertForm } from '@/components/JobAlertForm';
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
import { Sidebar, SidebarSection, SidebarNavList, SidebarCTA } from '@/components/sidebar/Sidebar';
import { buildJobsPaginationMetadata } from '@/lib/jobs/paginationMetadata';
import { getTotalPages, parsePageParam, buildJobsPageUrl } from '@/lib/jobs/pagination';
import Script from 'next/script';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';

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

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.nuclearhustle.com/' },
    { name: 'Jobs', url: 'https://www.nuclearhustle.com/jobs' },
    { name: `${stateInfo.name} Jobs`, url: `https://www.nuclearhustle.com/jobs/${state}` },
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbCurrent>{stateInfo.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Location</BrowseLabel>
        <BrowseTitle>Nuclear jobs in {stateInfo.name}</BrowseTitle>

        <div className="flex flex-wrap items-center gap-4">
          <BrowseMeta>
            <strong>{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}
            {totalPages > 1 && (
              <>
                <span className="text-muted mx-2" aria-hidden="true">/</span>
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
      <div className="border-b border-rule">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-xs uppercase tracking-widest text-secondary">Browse by role</span>
          {categories.map(({ category, name, count }) => (
            <FilterChip key={category} href={`/jobs/${state}/${category}`} count={count}>
              {name}
            </FilterChip>
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
                  <div className="border border-rule p-10 text-center">
                    <p className="font-sans text-sm text-secondary">Loading jobs…</p>
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
              <div className="border border-rule p-10 text-center">
                <p className="mb-2 font-sans text-base text-ink">
                  No jobs currently listed in {stateInfo.name}.
                </p>
                <p className="mb-6 font-sans text-sm text-secondary">
                  New roles are added daily — get notified the moment one is posted.
                </p>
                <div className="mb-4 flex justify-center">
                  <JobAlertForm />
                </div>
                <Link
                  href="/jobs"
                  className="font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
                >
                  Or browse all jobs →
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar>
            <SidebarSection label="Other states" footerHref="/jobs" footerLabel="All locations →">
              <SidebarNavList
                items={allActiveStates.map(({ state: otherState, count }) => ({
                  href: `/jobs/${otherState.slug}`,
                  label: otherState.name,
                  count,
                }))}
              />
            </SidebarSection>

            <SidebarCTA
              label={`Hiring in ${stateInfo.name}?`}
              body="Post a role and reach nuclear professionals actively looking."
              href="/signup/employer"
            />
          </Sidebar>
        </div>
      </div>
    </div>
  );
}
