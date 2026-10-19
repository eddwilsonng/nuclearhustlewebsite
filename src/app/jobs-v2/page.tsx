import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  getAllJobsForList,
  getAllActiveStates,
  getAllActiveCategories,
  getAllCompanies,
} from "@/lib/data/employer";
import { JobList } from "@/components/JobList";
import { FilterChip } from "@/components/FilterChip";
import { getTotalPages, parsePageParam, buildJobsPageUrl } from "@/lib/jobs/pagination";

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; company?: string; role?: string }>;
}

export const metadata: Metadata = {
  title: "All Nuclear Jobs - Browse Open Positions | Nuclear Hustle",
  description:
    "Browse all nuclear power plant jobs across the United States. Find reactor operator, engineering, maintenance, and health physics positions.",
  alternates: { canonical: "/jobs-v2" },
};

function JobListFallback() {
  return (
    <div className="border border-rule p-10 text-center">
      <p className="font-sans text-sm text-secondary">Loading jobs…</p>
    </div>
  );
}

export default async function JobsV2Page({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);
  const [jobs, companies, activeStates, activeCategories] = await Promise.all([
    getAllJobsForList(),
    getAllCompanies(),
    getAllActiveStates(),
    getAllActiveCategories(),
  ]);
  const totalPages = getTotalPages(jobs.length);

  if (page > totalPages) {
    redirect(buildJobsPageUrl("/jobs-v2", totalPages));
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Light editorial header — replaces the dark graphite slab */}
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">
            Jobs
          </p>
          <h1 className="mt-2 font-sans text-3xl font-bold tracking-tight text-ink md:text-4xl">
            All nuclear jobs
          </h1>
          <p className="mt-3 font-sans text-sm text-secondary">
            <strong className="font-semibold text-ink">
              {jobs.length.toLocaleString("en-US")}
            </strong>{" "}
            open positions
            <span className="mx-2 text-muted" aria-hidden="true">
              ·
            </span>
            <strong className="font-semibold text-ink">{companies.length}</strong>{" "}
            operators
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
        </div>
      </header>

      {/* Quick filter rows */}
      <div className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                State
              </span>
              {activeStates.slice(0, 5).map(({ state, count }) => (
                <FilterChip key={state.slug} href={`/jobs/${state.slug}`} count={count}>
                  {state.name}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Role
              </span>
              {activeCategories
                .filter(({ category }) => category !== "other")
                .map(({ category, name, count }) => (
                  <FilterChip key={category} href={`/jobs/role/${category}`} count={count}>
                    {name}
                  </FilterChip>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Suspense fallback={<JobListFallback />}>
          <JobList jobs={jobs} companies={companies} initialPage={page} />
        </Suspense>
      </div>
    </div>
  );
}
