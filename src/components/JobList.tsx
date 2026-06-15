'use client';

import { useState, useMemo } from 'react';
import { JobListItem, Company } from '@/lib/types';
import { JobCategory, getCategoryInfo } from '@/lib/categorize';
import { FilterSidebar } from './FilterSidebar';
import { PaginatedJobResults } from './PaginatedJobResults';

interface JobListProps {
  jobs: JobListItem[];
  companies: Company[];
  initialPage?: number;
}

export function JobList({ jobs, companies, initialPage = 1 }: JobListProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Role options derived from the full job set so counts stay stable as other
  // filters change. 'other' is hidden to match the role chips above the list.
  const categoryOptions = useMemo(() => {
    const counts = new Map<JobCategory, number>();
    for (const job of jobs) {
      counts.set(job.category, (counts.get(job.category) || 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([category]) => category !== 'other')
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
          job.company.name.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => {
      const aFeatured = a.is_featured && a.featured_until && new Date(a.featured_until) > new Date() ? 1 : 0;
      const bFeatured = b.is_featured && b.featured_until && new Date(b.featured_until) > new Date() ? 1 : 0;
      return bFeatured - aFeatured;
    });
  }, [jobs, selectedCompany, selectedCategory, searchQuery]);

  const resetKey = `${selectedCompany ?? ''}|${selectedCategory ?? ''}|${searchQuery}`;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <FilterSidebar
        companies={companies}
        categories={categoryOptions}
        selectedCompany={selectedCompany}
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        resultCount={filteredJobs.length}
        totalCount={jobs.length}
        onCompanyChange={setSelectedCompany}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 min-w-0">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-[#E5DFD5]">
            <p className="font-mono text-sm text-stone-500">No jobs found matching your criteria.</p>
            <p className="font-mono text-xs text-stone-400 mt-2">
              Try adjusting your filters or search terms.
            </p>
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
