import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  getAllJobsByCategory,
  getAllActiveStates,
  getAllActiveCategories,
  getAllActiveEngineeringDisciplines,
} from "@/lib/data/employer";
import { getCategoryInfo, getAllCategories, JobCategory } from "@/lib/categorize";
import { CategoryJobsList } from "@/components/CategoryJobsList";
import { FilterChip } from "@/components/FilterChip";
import { JobAlertForm } from "@/components/JobAlertForm";
import {
  Sidebar,
  SidebarSection,
  SidebarNavList,
  SidebarCTA,
} from "@/components/sidebar/Sidebar";
import { getTotalPages, parsePageParam, buildJobsPageUrl } from "@/lib/jobs/pagination";

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const jobs = await getAllJobsByCategory(category as JobCategory);
  return {
    title: `Nuclear ${categoryInfo.name} Jobs — ${jobs.length} Positions | Nuclear Hustle`,
    description:
      `Browse ${jobs.length} nuclear ${categoryInfo.name.toLowerCase()} jobs across the US. ${categoryInfo.description}`.slice(
        0,
        155,
      ),
    alternates: { canonical: `/jobs-v2/role/${category}` },
  };
}

export default async function CategoryV2Page({ params, searchParams }: PageProps) {
  const { category } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const categoryInfo = getCategoryInfo(category as JobCategory);
  const allCategories = getAllCategories();

  if (!allCategories.includes(category as JobCategory)) notFound();

  const jobs = await getAllJobsByCategory(category as JobCategory);
  const listJobs = jobs.map((j) => {
    const copy = { ...j };
    if (!copy.skills && copy.structured_description?.skills) {
      copy.skills = copy.structured_description.skills;
    }
    delete copy.description;
    delete copy.structured_description;
    return copy;
  });
  const basePath = `/jobs-v2/role/${category}`;
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages) {
    redirect(buildJobsPageUrl(basePath, totalPages));
  }

  const activeCategories = (await getAllActiveCategories()).filter(
    (c) => c.category !== category && c.category !== "other",
  );
  const engineeringDisciplines =
    category === "engineering" ? await getAllActiveEngineeringDisciplines() : [];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Light editorial header */}
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted"
          >
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/jobs-v2" className="hover:text-ink">
              Jobs
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{categoryInfo.name}</span>
          </nav>

          <p className="font-mono text-xs uppercase tracking-widest text-secondary">
            Role
          </p>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Nuclear {categoryInfo.name} jobs
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <p className="font-sans text-sm text-secondary">
              <strong className="font-semibold text-ink">{jobs.length}</strong> open
              position{jobs.length !== 1 ? "s" : ""}
              {totalPages > 1 && (
                <>
                  <span className="mx-2 text-muted" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                </>
              )}
            </p>
            {jobs.length > 0 && (
              <Link
                href="/signup"
                className="border border-control bg-raised px-3 py-1.5 font-sans text-sm text-ink transition-colors hover:border-ink hover:bg-surface"
              >
                Get {categoryInfo.name} alerts →
              </Link>
            )}
          </div>

          {categoryInfo.description && (
            <p className="mt-4 max-w-2xl font-sans text-sm leading-relaxed text-secondary">
              {categoryInfo.description}
            </p>
          )}
        </div>
      </header>

      {engineeringDisciplines.length > 0 && (
        <div className="border-b border-rule">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-4">
            <span className="mr-1 font-mono text-xs uppercase tracking-widest text-muted">
              Discipline
            </span>
            {engineeringDisciplines.map(({ slug, name, count }) => (
              <FilterChip
                key={slug}
                href={`/jobs/role/engineering/${slug}`}
                count={count}
              >
                {name}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-12 lg:grid-cols-4">
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
                  variant="compact"
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
                  href="/jobs-v2"
                  className="font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
                >
                  Or browse all jobs →
                </Link>
              </div>
            )}
          </div>

          <Sidebar>
            <SidebarSection label="Other roles" footerHref="/jobs-v2" footerLabel="All jobs →">
              <SidebarNavList
                items={activeCategories.map(({ category: cat, name, count }) => ({
                  href: `/jobs-v2/role/${cat}`,
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
