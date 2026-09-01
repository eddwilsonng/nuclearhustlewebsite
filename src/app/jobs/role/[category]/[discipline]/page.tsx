import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Script from 'next/script';
import { Suspense } from 'react';
import {
  getJobsByEngineeringDiscipline,
  getActiveEngineeringDisciplines,
  getActiveStates,
  getCompanies,
} from '@/lib/data/static';
import {
  getAllEngineeringDisciplineSlugs,
  getEngineeringDisciplineInfo,
} from '@/lib/categorize';
import { CategoryJobsList } from '@/components/CategoryJobsList';
import { LinkButton } from '@/components/ui/LinkButton';
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
import { generateCategoryPageSchema } from '@/lib/seo/schema';
import { buildJobsPaginationMetadata } from '@/lib/jobs/paginationMetadata';
import { getTotalPages, parsePageParam, buildJobsPageUrl } from '@/lib/jobs/pagination';

interface PageProps {
  params: Promise<{ category: string; discipline: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Only engineering currently exposes discipline sub-facets. Other categories
// have no nested pages, so this dynamic segment is statically generated only
// for the engineering disciplines and 404s otherwise.
export function generateStaticParams() {
  return getAllEngineeringDisciplineSlugs().map((discipline) => ({
    category: 'engineering',
    discipline,
  }));
}

function isEngineeringDiscipline(category: string, discipline: string) {
  return category === 'engineering' && !!getEngineeringDisciplineInfo(discipline);
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category, discipline } = await params;
  const { page: pageParam } = await searchParams;

  if (!isEngineeringDiscipline(category, discipline)) {
    return { title: 'Category Not Found | Nuclear Hustle' };
  }

  const info = getEngineeringDisciplineInfo(discipline)!;
  const jobs = getJobsByEngineeringDiscipline(discipline);
  const basePath = `/jobs/role/${category}/${discipline}`;

  return buildJobsPaginationMetadata({
    pageParam,
    totalJobs: jobs.length,
    basePath,
    page1Title: `${info.title} Jobs — ${jobs.length} Positions | Nuclear Hustle`,
    page1Description: `Browse ${jobs.length} ${info.title.toLowerCase()} jobs across the US. ${info.description}`.slice(0, 155),
    pagedTitle: (page, totalPages) =>
      `${info.title} Jobs — Page ${page} of ${totalPages} | Nuclear Hustle`,
    pagedDescription: (page, totalPages, totalJobs) =>
      `Page ${page} of ${totalPages} — ${totalJobs} ${info.title.toLowerCase()} jobs across the US.`,
  });
}

export default async function DisciplinePage({ params, searchParams }: PageProps) {
  const { category, discipline } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  if (!isEngineeringDiscipline(category, discipline)) notFound();

  const info = getEngineeringDisciplineInfo(discipline)!;
  const jobs = getJobsByEngineeringDiscipline(discipline);
  // Strip heavy description fields — listing cards don't use them, and they
  // would bloat the serialized client payload past Google's 2MB indexing limit.
  const listJobs = jobs.map((j) => {
    const copy = { ...j };
    if (!copy.skills && copy.structured_description?.skills) {
      copy.skills = copy.structured_description.skills;
    }
    delete copy.description;
    delete copy.structured_description;
    return copy;
  });

  const basePath = `/jobs/role/${category}/${discipline}`;
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages && totalPages > 0) {
    redirect(buildJobsPageUrl(basePath, totalPages));
  }

  const activeStates = getActiveStates();
  const siblingDisciplines = getActiveEngineeringDisciplines().filter(
    (d) => d.slug !== discipline
  );

  const companies = getCompanies();
  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const url = `https://www.nuclearhustle.com${basePath}`;
  const schemaData = generateCategoryPageSchema({
    categoryName: info.title,
    categoryDescription: info.description,
    jobCount: jobs.length,
    jobs: jobs.slice(0, 50),
    companies: companyMap,
    states: activeStates.map((s) => s.state.name),
    url,
  });

  return (
    <div className="min-h-screen bg-canvas">
      <Script
        id="discipline-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbLink href="/jobs/role/engineering">Engineering</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbCurrent>{info.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Engineering Discipline</BrowseLabel>
        <BrowseTitle>{info.title} jobs</BrowseTitle>

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
              ★ Get {info.name} engineering job alerts →
            </BrowseAlertLink>
          )}
        </div>

        <BrowseDescription>{info.description}</BrowseDescription>
      </BrowsePageHeader>

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
                <CategoryJobsList
                  jobs={listJobs}
                  categoryName={info.title}
                  hideCategory
                  initialPage={page}
                  basePath={basePath}
                />
              </Suspense>
            ) : (
              <div className="border border-rule p-10 text-center">
                <p className="mb-2 font-sans text-base text-ink">
                  No {info.title.toLowerCase()} jobs currently listed.
                </p>
                <p className="mb-6 font-sans text-sm text-secondary">
                  New roles are added daily — set up an alert so you don&apos;t miss one.
                </p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <LinkButton href="/signup" variant="primary">
                    Get job alerts →
                  </LinkButton>
                  <LinkButton href="/jobs/role/engineering" variant="secondary">
                    All engineering jobs →
                  </LinkButton>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar>
            <SidebarSection
              label="Other disciplines"
              footerHref="/jobs/role/engineering"
              footerLabel="All engineering →"
            >
              <SidebarNavList
                items={siblingDisciplines.map(({ slug, name, count }) => ({
                  href: `/jobs/role/engineering/${slug}`,
                  label: name,
                  count,
                }))}
              />
            </SidebarSection>

            <SidebarCTA
              label="Hiring?"
              body={`Post a ${info.name.toLowerCase()} engineering role and reach qualified nuclear professionals.`}
              href="/signup/employer"
            />
          </Sidebar>
        </div>
      </div>
    </div>
  );
}
