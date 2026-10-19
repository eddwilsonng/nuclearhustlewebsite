'use client';

import { useState, useMemo } from 'react';
import type { JobWithCompany } from '@/lib/types';
import { toJobListItem } from '@/lib/jobUtils';
import { getStateBySlug } from '@/lib/states';
import { cn } from '@/lib/cn';
import { PaginatedJobResults } from './PaginatedJobResults';
import { FilterChipButton } from './FilterChip';
import { JobAlertForm } from './JobAlertForm';

type SortOption = 'recent' | 'featured' | 'alphabetical';

interface CategoryJobsListProps {
  jobs: JobWithCompany[];
  categoryName: string;
  hideCategory?: boolean;
  initialPage?: number;
  basePath: string;
  /** 'compact' collapses sort + state into one tidy toolbar (prototype). */
  variant?: 'default' | 'compact';
}

export function CategoryJobsList({
  jobs,
  categoryName,
  hideCategory,
  initialPage = 1,
  basePath,
  variant = 'default',
}: CategoryJobsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showAllStates, setShowAllStates] = useState(false);

  // Derive state chips from THIS list's jobs so the chip count matches what
  // filtering actually returns (e.g. engineering∩Illinois, not all-Illinois).
  const allStates = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs) {
      if (job.state) counts.set(job.state, (counts.get(job.state) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([slug, count]) => ({ state: getStateBySlug(slug)!, count }))
      .filter((s) => s.state)
      .sort((a, b) => b.count - a.count);
  }, [jobs]);

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
      {variant === 'compact' ? (
        <div className="mb-6 flex flex-col gap-3 border-b border-rule pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-widest text-muted">
              Sort
            </span>
            <div
              role="group"
              aria-label="Sort jobs"
              className="inline-flex border border-control"
            >
              {(['recent', 'featured', 'alphabetical'] as const).map((option, i) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={sortBy === option}
                  onClick={() => setSortBy(option)}
                  className={cn(
                    'min-h-9 px-3 py-1.5 font-sans text-sm transition-colors',
                    i > 0 && 'border-l border-control',
                    sortBy === option
                      ? 'bg-ink text-inverse-ink'
                      : 'text-secondary hover:bg-surface hover:text-ink',
                  )}
                >
                  {option === 'recent' ? 'Recent' : option === 'featured' ? 'Featured' : 'A–Z'}
                </button>
              ))}
            </div>
          </div>

          {allStates.length > 0 && (
            <div className="inline-flex items-center gap-3">
              <label
                htmlFor="state-filter"
                className="font-mono text-xs uppercase tracking-widest text-muted"
              >
                State
              </label>
              <select
                id="state-filter"
                value={selectedState ?? ''}
                onChange={(e) => setSelectedState(e.target.value || null)}
                className="min-h-9 border border-control bg-raised px-3 py-1.5 font-sans text-sm text-ink"
              >
                <option value="">All states ({jobs.length})</option>
                {allStates.map(({ state, count }) => (
                  <option key={state.slug} value={state.slug}>
                    {state.name} ({count})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="font-mono text-xs uppercase tracking-widest text-secondary">Sort by</label>
            <div className="flex flex-wrap gap-2">
              {(['recent', 'featured', 'alphabetical'] as const).map((option) => (
                <FilterChipButton
                  key={option}
                  active={sortBy === option}
                  onClick={() => setSortBy(option)}
                  aria-pressed={sortBy === option}
                >
                  {option === 'recent' ? 'Recent' : option === 'featured' ? 'Featured first' : 'Alphabetical'}
                </FilterChipButton>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-secondary">Filter by state</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {visibleStates.map(({ state, count }) => (
                <FilterChipButton
                  key={state.slug}
                  active={selectedState === state.slug}
                  count={count}
                  onClick={() => setSelectedState(selectedState === state.slug ? null : state.slug)}
                  aria-pressed={selectedState === state.slug}
                >
                  {state.name}
                </FilterChipButton>
              ))}
            </div>
            {!showAllStates && allStates.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllStates(true)}
                className="font-sans text-sm text-secondary hover:text-ink"
              >
                Show all states →
              </button>
            )}
            {showAllStates && (
              <button
                type="button"
                onClick={() => setShowAllStates(false)}
                className="font-sans text-sm text-secondary hover:text-ink"
              >
                Show fewer →
              </button>
            )}
          </div>
        </>
      )}

      {sortedJobs.length > 0 ? (
        <PaginatedJobResults
          jobs={listItems}
          initialPage={initialPage}
          basePath={basePath}
          hideCategory={hideCategory}
          resetKey={resetKey}
        />
      ) : (
        <div className="border border-rule p-10 text-center">
          <p className="mb-2 font-sans text-base text-ink">
            No {categoryName.toLowerCase()} jobs found{selectedState ? ` in ${selectedState}` : ''}.
          </p>
          <p className="mb-6 font-sans text-sm text-secondary">
            New roles are added daily — get notified the moment one is posted.
          </p>
          <div className="flex justify-center">
            <JobAlertForm />
          </div>
        </div>
      )}
    </div>
  );
}
