import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Suspense } from 'react';
import { getJobsByCategory, getActiveStates, getActiveCategories, getActiveEngineeringDisciplines, getCompanies } from '@/lib/data/static';
import { getCategoryInfo, getAllCategories, JobCategory } from '@/lib/categorize';
import { CategoryJobsList } from '@/components/CategoryJobsList';
import { FilterChip } from '@/components/FilterChip';
import { JobAlertForm } from '@/components/JobAlertForm';
import { Sidebar, SidebarSection, SidebarNavList, SidebarCTA } from '@/components/sidebar/Sidebar';
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
import { generateCategoryPageSchema, generateBreadcrumbSchema } from '@/lib/seo/schema';
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
    if (!copy.skills && copy.structured_description?.skills) {
      copy.skills = copy.structured_description.skills;
    }
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
  // Engineering exposes discipline sub-facets (electrical, mechanical, …).
  const engineeringDisciplines =
    category === 'engineering' ? getActiveEngineeringDisciplines() : [];

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
  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.nuclearhustle.com/' },
    { name: 'Jobs', url: 'https://www.nuclearhustle.com/jobs' },
    { name: `${categoryInfo.name} Jobs`, url },
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <Script
        id="category-schema"
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
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbCurrent>{categoryInfo.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Role</BrowseLabel>
        <BrowseTitle>Nuclear {categoryInfo.name} jobs</BrowseTitle>

        <div className="flex flex-wrap items-center gap-4 mb-3">
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
              ★ Get {categoryInfo.name} job alerts →
            </BrowseAlertLink>
          )}
        </div>

        {categoryInfo.description && (
          <BrowseDescription>{categoryInfo.description}</BrowseDescription>
        )}
      </BrowsePageHeader>

      {/* Engineering discipline sub-nav */}
      {engineeringDisciplines.length > 0 && (
        <div className="border-b border-rule">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-4">
            <span className="mr-1 font-mono text-xs uppercase tracking-widest text-secondary">
              Discipline
            </span>
            {engineeringDisciplines.map(({ slug, name, count }) => (
              <FilterChip key={slug} href={`/jobs/role/engineering/${slug}`} count={count}>
                {name}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* Job list with sorting/filtering */}
          <div className="lg:col-span-3">
            {jobs.length > 0 ? (
              <Suspense
                fallback={
                  <div className="border border-rule p-10 text-center">
                    <p className="font-sans text-sm text-secondary">Loading jobs…</p>
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
              <div className="border border-rule p-10 text-center">
                <p className="mb-2 font-sans text-base text-ink">
                  No {categoryInfo.name.toLowerCase()} jobs currently listed.
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
            <SidebarSection label="Other roles" footerHref="/jobs" footerLabel="All jobs →">
              <SidebarNavList
                items={activeCategories.map(({ category: cat, name, count }) => ({
                  href: `/jobs/role/${cat}`,
                  label: name,
                  count,
                }))}
              />
            </SidebarSection>

            <SidebarCTA
              label="Hiring?"
              body={`Post a ${categoryInfo.name.toLowerCase()} role and reach qualified nuclear professionals.`}
              href="/signup/employer"
            />
          </Sidebar>
        </div>
      </div>
    </div>
  );
}
