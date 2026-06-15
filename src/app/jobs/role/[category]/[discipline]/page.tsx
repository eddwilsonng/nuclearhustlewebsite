import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen bg-[#EDE8DF]">
      <Script
        id="discipline-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbLink href="/jobs/role/engineering">Engineering</BrowseBreadcrumbLink>
          <span className="text-stone-600" aria-hidden="true">//</span>
          <BrowseBreadcrumbCurrent>{info.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Engineering Discipline</BrowseLabel>
        <BrowseTitle>{info.title} jobs</BrowseTitle>

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
                  <div className="border border-[#CFC8BC] p-10 text-center">
                    <p className="font-mono text-xs tracking-widest uppercase text-stone-400">Loading jobs…</p>
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
              <div className="border border-[#CFC8BC] p-10 text-center">
                <p className="font-mono text-sm text-stone-400 mb-2">
                  No {info.title.toLowerCase()} jobs currently listed.
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
                    href="/jobs/role/engineering"
                    className="font-mono text-xs tracking-widest uppercase px-5 py-3 border border-[#CFC8BC] text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors"
                  >
                    All engineering jobs →
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
                Be first to hear about new {info.name.toLowerCase()} engineering roles.
              </p>
              <Link
                href="/signup"
                className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
              >
                Create free alert →
              </Link>
            </div>

            {/* Other engineering disciplines */}
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4">Other disciplines</p>
              <ul className="border border-[#CFC8BC]">
                {siblingDisciplines.map(({ slug, name, count }) => (
                  <li key={slug} className="border-b border-[#CFC8BC] last:border-b-0">
                    <Link
                      href={`/jobs/role/engineering/${slug}`}
                      className="flex items-center justify-between px-3 py-2 font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-[#E5DFD5] transition-colors"
                    >
                      <span>{name}</span>
                      <span className="text-stone-400">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/jobs/role/engineering"
                className="block font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors mt-3"
              >
                All engineering →
              </Link>
            </div>

            {/* Employer nudge */}
            <div className="border border-[#CFC8BC] p-5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">Hiring?</p>
              <p className="font-mono text-xs text-stone-500 leading-relaxed mb-4">
                Post a {info.name.toLowerCase()} engineering role and reach qualified nuclear professionals.
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
