'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { JobListItem } from '@/lib/types';
import { JobCard } from './JobCard';
import {
  JOBS_PAGE_SIZE,
  buildJobsPageUrl,
  getPageNavItems,
  getTotalPages,
} from '@/lib/jobs/pagination';

interface PaginatedJobResultsProps {
  jobs: JobListItem[];
  initialPage?: number;
  basePath?: string;
  hideCategory?: boolean;
  /** Bump when filters change so pagination resets to page 1. */
  resetKey?: string;
}

export function PaginatedJobResults({
  jobs,
  initialPage = 1,
  basePath,
  hideCategory,
  resetKey = '',
}: PaginatedJobResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedBasePath = basePath ?? pathname;

  const [visibleCount, setVisibleCount] = useState(initialPage * JOBS_PAGE_SIZE);

  // Reset when filters/sort change
  useEffect(() => {
    setVisibleCount(JOBS_PAGE_SIZE);
    if (searchParams.get('page')) {
      router.replace(resolvedBasePath, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const totalPages = getTotalPages(jobs.length);
  const visibleJobs = useMemo(
    () => jobs.slice(0, visibleCount),
    [jobs, visibleCount]
  );
  const hasMore = visibleCount < jobs.length;
  const remaining = jobs.length - visibleCount;
  const currentPage = Math.ceil(visibleCount / JOBS_PAGE_SIZE);

  const loadMore = () => {
    const nextCount = Math.min(visibleCount + JOBS_PAGE_SIZE, jobs.length);
    setVisibleCount(nextCount);
    const nextPage = Math.ceil(nextCount / JOBS_PAGE_SIZE);
    router.replace(buildJobsPageUrl(resolvedBasePath, nextPage), { scroll: false });
  };

  if (jobs.length === 0) {
    return null;
  }

  const pageNavItems = getPageNavItems(currentPage, totalPages);

  return (
    <div>
      <p className="font-mono text-xs text-stone-500 mb-4">
        Showing{' '}
        <strong className="text-stone-900">{visibleJobs.length}</strong> of{' '}
        <strong className="text-stone-900">{jobs.length}</strong> jobs
      </p>

      <div className="border border-[#CFC8BC]">
        {visibleJobs.map((job) => (
          <JobCard key={job.id} job={job} hideCategory={hideCategory} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors w-full sm:w-auto"
          >
            Load {Math.min(remaining, JOBS_PAGE_SIZE)} more jobs
            <span className="text-stone-700 font-normal normal-case tracking-normal ml-1">
              ({remaining} remaining)
            </span>
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Job listing pages"
          className="mt-8 pt-6 border-t border-[#CFC8BC]"
        >
          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-3 text-center">
            Pages
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-1">
            {currentPage > 1 && (
              <li>
                <Link
                  href={buildJobsPageUrl(resolvedBasePath, currentPage - 1)}
                  className="font-mono text-xs tracking-widest uppercase px-3 py-2 border border-[#CFC8BC] text-stone-500 hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  ← Prev
                </Link>
              </li>
            )}

            {pageNavItems.map((item, i) =>
              item === null ? (
                <li
                  key={`gap-${i}`}
                  className="font-mono text-xs text-stone-400 px-1 select-none"
                  aria-hidden="true"
                >
                  …
                </li>
              ) : (
                <li key={item}>
                  <Link
                    href={buildJobsPageUrl(resolvedBasePath, item)}
                    aria-current={item === currentPage ? 'page' : undefined}
                    className={`font-mono text-xs tracking-widest uppercase min-w-[2.25rem] text-center px-2 py-2 border transition-colors ${
                      item === currentPage
                        ? 'border-yellow-400 bg-yellow-50 text-stone-900 font-bold'
                        : 'border-[#CFC8BC] text-stone-500 hover:border-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {item}
                  </Link>
                </li>
              )
            )}

            {currentPage < totalPages && (
              <li>
                <Link
                  href={buildJobsPageUrl(resolvedBasePath, currentPage + 1)}
                  className="font-mono text-xs tracking-widest uppercase px-3 py-2 border border-[#CFC8BC] text-stone-500 hover:border-stone-400 hover:text-stone-900 transition-colors"
                >
                  Next →
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}
