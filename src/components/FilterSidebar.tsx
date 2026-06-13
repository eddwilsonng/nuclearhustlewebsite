'use client';

import { Company, Region, REGIONS } from '@/lib/types';

interface FilterSidebarProps {
  companies: Company[];
  selectedCompany: string | null;
  selectedRegion: Region | null;
  searchQuery: string;
  onCompanyChange: (companyId: string | null) => void;
  onRegionChange: (region: Region | null) => void;
  onSearchChange: (query: string) => void;
}

export function FilterSidebar({
  companies,
  selectedCompany,
  selectedRegion,
  searchQuery,
  onCompanyChange,
  onRegionChange,
  onSearchChange,
}: FilterSidebarProps) {
  return (
    <aside className="w-full lg:w-64 space-y-6">
      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-stone-700 mb-2">
          Search
        </label>
        <input
          type="text"
          id="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Job title or location..."
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
        />
      </div>

      {/* Company Filter */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-stone-700 mb-2">
          Company
        </label>
        <select
          id="company"
          value={selectedCompany || ''}
          onChange={(e) => onCompanyChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-[#EDE8DF]"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Region Filter */}
      <div>
        <label htmlFor="region" className="block text-sm font-medium text-stone-700 mb-2">
          Region
        </label>
        <select
          id="region"
          value={selectedRegion || ''}
          onChange={(e) => onRegionChange((e.target.value as Region) || null)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-[#EDE8DF]"
        >
          <option value="">All Regions</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {(selectedCompany || selectedRegion || searchQuery) && (
        <button
          onClick={() => {
            onCompanyChange(null);
            onRegionChange(null);
            onSearchChange('');
          }}
          className="w-full px-4 py-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-300 rounded-lg hover:bg-[#E5DFD5] transition-colors"
        >
          Clear Filters
        </button>
      )}
    </aside>
  );
}
