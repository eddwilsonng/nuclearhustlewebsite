import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import { getJobsByCategory, getActiveStates, getActiveCategories, getCompanies } from '@/lib/data/static';
import { getCategoryInfo, getAllCategories, JobCategory } from '@/lib/categorize';
import { CategoryJobsList } from '@/components/CategoryJobsList';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
  BrowseDescription,
  BrowseAlertLink,
} from '@/components/BrowsePageHeader';
import { generateCategoryPageSchema } from '@/lib/seo/schema';
import { buildJobsPaginationMetadata } from '@/lib/jobs/paginationMetadata';
import { getTotalPages, parsePageParam, buildJobsPageUrl } from '@/lib/jobs/pagination';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const categoryInfo = getCategoryInfo(category as JobCategory);

  if (categoryInfo.id === 'other' && category !== 'other') {
    return { title: 'Category Not Found | Nuclear Hustle' };
  }

  const jobs = getJobsByCategory(category as JobCategory);
  const basePath = `/jobs/role/${category}`;

  return buildJobsPaginationMetadata({
    pageParam,
    totalJobs: jobs.length,
    basePath,
    page1Title: `Nuclear ${categoryInfo.name} Jobs — ${jobs.length} Positions | Nuclear Hustle`,
    page1Description: `Browse ${jobs.length} nuclear ${categoryInfo.name.toLowerCase()} jobs across the US. ${categoryInfo.description}`.slice(0, 155),
    pagedTitle: (page, totalPages) =>
      `Nuclear ${categoryInfo.name} Jobs — Page ${page} of ${totalPages} | Nuclear Hustle`,
    pagedDescription: (page, totalPages, totalJobs) =>
      `Page ${page} of ${totalPages} — ${totalJobs} nuclear ${categoryInfo.name.toLowerCase()} jobs across the US.`,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const allCategories = getAllCategories();

  if (!allCategories.includes(category as JobCategory)) notFound();

  const jobs = getJobsByCategory(category as JobCategory);
  // CategoryJobsList is a client component, so anything passed to it is
  // serialized into the page HTML. Strip the heavy description fields (not used
  // by listing cards, which need `state` for filtering so toJobListItem won't
  // fit) to keep paginated category pages well under Google's 2MB indexing
  // limit — full descriptions only belong on the job detail page.
  const listJobs = jobs.map((j) => {
    const copy = { ...j };
    delete copy.description;
    delete copy.structured_description;
    return copy;
  });
  const basePath = `/jobs/role/${category}`;
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages) {
    redirect(buildJobsPageUrl(basePath, totalPages));
  }
  const activeStates = getActiveStates();
  // Exclude current category and 'other' from the sidebar list
  const activeCategories = getActiveCategories().filter(
    (c) => c.category !== category && c.category !== 'other'
  );

  // Get company names for schema
  const companies = getCompanies();
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  // Generate schema markup
  const url = `https://www.nuclearhustle.com/jobs/role/${category}`;
  const schemaData = generateCategoryPageSchema({
    categoryName: categoryInfo.name,
    categoryDescription: categoryInfo.description || '',
    jobCount: jobs.length,
    jobs: jobs.slice(0, 50),
    companies: companyMap,
    states: activeStates.map((s) => s.state.name),
    url,
  });

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      <Script
        id="category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbCurrent>{categoryInfo.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Role</BrowseLabel>
        <BrowseTitle>Nuclear {categoryInfo.name} jobs</BrowseTitle>

        <div className="flex flex-wrap items-center gap-4 mb-3">
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
              ★ Get {categoryInfo.name} job alerts →
            </BrowseAlertLink>
          )}
        </div>

        {categoryInfo.description && (
          <BrowseDescription>{categoryInfo.description}</BrowseDescription>
        )}
      </BrowsePageHeader>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Job list with sorting/filtering */}
          <div className="lg:col-span-3">
            {jobs.length > 0 ? (
              <Suspense
                fallback={
                  <div className="border border-[#CFC8BC] p-10 text-center">
                    <p className="font-mono text-xs tracking-widest uppercase text-stone-400">Loading jobs…</p>
                  </div>
                }
              >
                <CategoryJobsList
                  jobs={listJobs}
                  categoryName={categoryInfo.name}
                  hideCategory
                  initialPage={page}
                  basePath={basePath}
                />
              </Suspense>
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
