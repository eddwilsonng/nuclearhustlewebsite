"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { JobListItem, Company } from "@/lib/types";
import { JobCategory, getCategoryInfo } from "@/lib/categorize";
import { FilterSidebar } from "./FilterSidebar";
import { PaginatedJobResults } from "./PaginatedJobResults";
import { JobAlertForm } from "./JobAlertForm";

interface JobListProps {
  jobs: JobListItem[];
  companies: Company[];
  initialPage?: number;
}

export function JobList({ jobs, companies, initialPage = 1 }: JobListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const selectedCompany = searchParams.get("company");
  const selectedCategory = (searchParams.get("role") as JobCategory | null) || null;

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const categoryOptions = useMemo(() => {
    const counts = new Map<JobCategory, number>();
    for (const job of jobs) {
      counts.set(job.category, (counts.get(job.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([category]) => category !== "other")
      .map(([category, count]) => ({
        category,
        name: getCategoryInfo(category).name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (selectedCompany) {
      result = result.filter((job) => job.company_id === selectedCompany);
    }

    if (selectedCategory) {
      result = result.filter((job) => job.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.company.name.toLowerCase().includes(query),
      );
    }

    return result.sort((a, b) => {
      const aFeatured =
        a.is_featured && a.featured_until && new Date(a.featured_until) > new Date()
          ? 1
          : 0;
      const bFeatured =
        b.is_featured && b.featured_until && new Date(b.featured_until) > new Date()
          ? 1
          : 0;
      return bFeatured - aFeatured;
    });
  }, [jobs, selectedCompany, selectedCategory, searchQuery]);

  const resetKey = `${selectedCompany ?? ""}|${selectedCategory ?? ""}|${searchQuery}`;

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <FilterSidebar
        companies={companies}
        categories={categoryOptions}
        selectedCompany={selectedCompany}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        resultCount={filteredJobs.length}
        totalCount={jobs.length}
        onCompanyChange={(value) => setParam("company", value)}
        onCategoryChange={(value) => setParam("role", value)}
        onSearchChange={(value) => setParam("q", value || null)}
      />

      <div className="min-w-0 flex-1">
        {filteredJobs.length === 0 ? (
          <div className="bg-surface px-6 py-12 text-center">
            <p className="font-sans text-base text-ink">No jobs match those filters.</p>
            <p className="mt-2 mb-6 font-sans text-sm text-secondary">
              Clear a filter, or get the Monday digest instead.
            </p>
            <div className="flex justify-center">
              <JobAlertForm />
            </div>
          </div>
        ) : (
          <PaginatedJobResults
            jobs={filteredJobs}
            initialPage={initialPage}
            resetKey={resetKey}
          />
        )}
      </div>
    </div>
  );
}
