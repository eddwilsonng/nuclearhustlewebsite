'use client';

import { useState, useMemo } from 'react';
import { JobListItem, Company, Region } from '@/lib/types';
import { FilterSidebar } from './FilterSidebar';
import { PaginatedJobResults } from './PaginatedJobResults';

interface JobListProps {
  jobs: JobListItem[];
  companies: Company[];
  initialPage?: number;
}

export function JobList({ jobs, companies, initialPage = 1 }: JobListProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (selectedCompany) {
      result = result.filter((job) => job.company_id === selectedCompany);
    }

    if (selectedRegion) {
      result = result.filter((job) => {
        const company = companies.find((c) => c.id === job.company_id);
        return company !== undefined;
      });
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
  }, [jobs, companies, selectedCompany, selectedRegion, searchQuery]);

  const resetKey = `${selectedCompany ?? ''}|${selectedRegion ?? ''}|${searchQuery}`;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <FilterSidebar
        companies={companies}
        selectedCompany={selectedCompany}
        selectedRegion={selectedRegion}
        searchQuery={searchQuery}
        onCompanyChange={setSelectedCompany}
        onRegionChange={setSelectedRegion}
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
