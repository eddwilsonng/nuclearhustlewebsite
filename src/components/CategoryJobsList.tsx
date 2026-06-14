'use client';

import { useState, useMemo } from 'react';
import type { JobWithCompany } from '@/lib/types';
import { getActiveStates, toJobListItem } from '@/lib/data/static';
import { PaginatedJobResults } from './PaginatedJobResults';

type SortOption = 'recent' | 'featured' | 'alphabetical';

interface CategoryJobsListProps {
  jobs: JobWithCompany[];
  categoryName: string;
  hideCategory?: boolean;
  initialPage?: number;
  basePath: string;
}

export function CategoryJobsList({
  jobs,
  categoryName,
  hideCategory,
  initialPage = 1,
  basePath,
}: CategoryJobsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showAllStates, setShowAllStates] = useState(false);

  const allStates = getActiveStates();

  const filteredJobs = useMemo(
    () => (selectedState ? jobs.filter((j) => j.state === selectedState) : jobs),
    [jobs, selectedState]
  );

  const sortedJobs = useMemo(() => {
    const copy = [...filteredJobs];
    switch (sortBy) {
      case 'featured':
        return copy.sort((a, b) => {
          const aFeatured = a.is_featured && a.featured_until && new Date(a.featured_until) > new Date() ? 1 : 0;
          const bFeatured = b.is_featured && b.featured_until && new Date(b.featured_until) > new Date() ? 1 : 0;
          if (aFeatured !== bFeatured) return bFeatured - aFeatured;
          return new Date(b.scraped_at || 0).getTime() - new Date(a.scraped_at || 0).getTime();
        });
      case 'alphabetical':
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case 'recent':
      default:
        return copy.sort((a, b) => new Date(b.scraped_at || 0).getTime() - new Date(a.scraped_at || 0).getTime());
    }
  }, [filteredJobs, sortBy]);

  const listItems = useMemo(
    () => sortedJobs.map(toJobListItem),
    [sortedJobs]
  );

  const resetKey = `${sortBy}|${selectedState ?? ''}`;
  const visibleStates = showAllStates ? allStates : allStates.slice(0, 8);

  return (
    <div>
      {/* Sort options */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="font-mono text-xs tracking-widest uppercase text-stone-400">Sort by</label>
        <div className="flex flex-wrap gap-2">
          {(['recent', 'featured', 'alphabetical'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSortBy(option)}
              className={`font-mono text-xs tracking-widest uppercase px-3 py-1 border transition-colors ${
                sortBy === option
                  ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                  : 'border-[#CFC8BC] text-stone-500 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {option === 'recent' ? 'Recent' : option === 'featured' ? 'Featured first' : 'Alphabetical'}
            </button>
          ))}
        </div>
      </div>

      {/* State filter chips */}
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">Filter by state</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {visibleStates.map(({ state, count }) => (
            <button
              key={state.slug}
              type="button"
              onClick={() => setSelectedState(selectedState === state.slug ? null : state.slug)}
              className={`font-mono text-xs tracking-widest uppercase px-3 py-1 border transition-colors ${
                selectedState === state.slug
                  ? 'border-yellow-400 bg-yellow-50 text-stone-900'
                  : 'border-[#CFC8BC] text-stone-500 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {state.name}
              <span className="ml-1.5 text-stone-400">({count})</span>
            </button>
          ))}
        </div>
        {!showAllStates && allStates.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllStates(true)}
            className="font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors"
          >
            Show all states →
          </button>
        )}
        {showAllStates && (
          <button
            type="button"
            onClick={() => setShowAllStates(false)}
            className="font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors"
          >
            Show fewer →
          </button>
        )}
      </div>

      {sortedJobs.length > 0 ? (
        <PaginatedJobResults
          jobs={listItems}
          initialPage={initialPage}
          basePath={basePath}
          hideCategory={hideCategory}
          resetKey={resetKey}
        />
      ) : (
        <div className="border border-[#CFC8BC] p-10 text-center">
          <p className="font-mono text-sm text-stone-400">
            No {categoryName.toLowerCase()} jobs found{selectedState ? ` in ${selectedState}` : ''}.
          </p>
        </div>
      )}
    </div>
  );
}
