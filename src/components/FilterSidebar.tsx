'use client';

import { Company } from '@/lib/types';
import { JobCategory } from '@/lib/categorize';

interface CategoryOption {
  category: JobCategory;
  name: string;
  count: number;
}

interface FilterSidebarProps {
  companies: Company[];
  categories: CategoryOption[];
  selectedCompany: string | null;
  selectedCategory: JobCategory | null;
  searchQuery: string;
  resultCount: number;
  totalCount: number;
  onCompanyChange: (companyId: string | null) => void;
  onCategoryChange: (category: JobCategory | null) => void;
  onSearchChange: (query: string) => void;
}

const fieldClass =
  'w-full px-3 py-2 font-mono text-sm border border-[#CFC8BC] bg-[#EDE8DF] text-stone-800 placeholder:text-stone-400 focus:border-yellow-400 focus:outline-none transition-colors';

const labelClass =
  'block font-mono text-xs tracking-widest uppercase text-stone-500 mb-2';

export function FilterSidebar({
  companies,
  categories,
  selectedCompany,
  selectedCategory,
  searchQuery,
  resultCount,
  totalCount,
  onCompanyChange,
  onCategoryChange,
  onSearchChange,
}: FilterSidebarProps) {
  const hasActiveFilters = Boolean(selectedCompany || selectedCategory || searchQuery);

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="border border-[#CFC8BC] lg:sticky lg:top-6">
        <div className="flex items-center justify-between border-b border-[#CFC8BC] px-4 py-3">
          <span className="font-mono text-xs tracking-widest uppercase text-stone-500">
            Filter
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onCompanyChange(null);
                onCategoryChange(null);
                onSearchChange('');
              }}
              className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors"
            >
              Clear ✕
            </button>
          )}
        </div>

        <div className="space-y-5 p-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className={labelClass}>
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Job title or location…"
              className={fieldClass}
            />
          </div>

          {/* Role / Category */}
          <div>
            <label htmlFor="category" className={labelClass}>
              Role
            </label>
            <select
              id="category"
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange((e.target.value as JobCategory) || null)}
              className={fieldClass}
            >
              <option value="">All roles</option>
              {categories.map(({ category, name, count }) => (
                <option key={category} value={category}>
                  {name} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className={labelClass}>
              Company
            </label>
            <select
              id="company"
              value={selectedCompany || ''}
              onChange={(e) => onCompanyChange(e.target.value || null)}
              className={fieldClass}
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-[#CFC8BC] px-4 py-3">
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">
            {hasActiveFilters ? (
              <>
                <span className="text-stone-700">{resultCount}</span> of {totalCount} jobs
              </>
            ) : (
              <>
                <span className="text-stone-700">{totalCount}</span> jobs
              </>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
