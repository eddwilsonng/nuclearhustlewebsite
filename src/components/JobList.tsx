'use client';

import { useState, useMemo } from 'react';
import { JobWithCompany, Company, Region } from '@/lib/types';
import { JobCard } from './JobCard';
import { FilterSidebar } from './FilterSidebar';

interface JobListProps {
  jobs: JobWithCompany[];
  companies: Company[];
}

export function JobList({ jobs, companies }: JobListProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (selectedCompany) {
      result = result.filter((job) => job.company_id === selectedCompany);
    }

    if (selectedRegion) {
      // For now, filter by location text containing region info
      // In production, this would use the plants data
      result = result.filter((job) => {
        const company = companies.find((c) => c.id === job.company_id);
        return company !== undefined; // Simplified - all companies match for now
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

    return result;
  }, [jobs, companies, selectedCompany, selectedRegion, searchQuery]);

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

      <main className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No jobs found matching your criteria.</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
