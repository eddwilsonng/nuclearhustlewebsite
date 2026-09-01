'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { JobListItem } from '@/lib/types';
import { JobCard } from './JobCard';
import { Button } from '@/components/ui/Button';
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
      <p className="mb-4 font-sans text-sm text-secondary">
        Showing{" "}
        <strong className="text-ink">{visibleJobs.length}</strong> of{" "}
        <strong className="text-ink">{jobs.length}</strong> jobs
      </p>

      <div className="border border-rule">
        {visibleJobs.map((job) => (
          <JobCard key={job.id} job={job} hideCategory={hideCategory} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button type="button" onClick={loadMore} variant="primary">
            Load {Math.min(remaining, JOBS_PAGE_SIZE)} more jobs
            <span className="ml-1 font-normal">
              ({remaining} remaining)
            </span>
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Job listing pages"
          className="mt-8 border-t border-rule pt-6"
        >
          <p className="mb-3 text-center font-mono text-xs uppercase tracking-widest text-secondary">
            Pages
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-1">
            {currentPage > 1 && (
              <li>
                <Link
                  href={buildJobsPageUrl(resolvedBasePath, currentPage - 1)}
                  className="inline-flex min-h-11 items-center border border-control px-3 py-2 font-sans text-sm text-secondary hover:border-ink hover:text-ink"
                >
                  ← Prev
                </Link>
              </li>
            )}

            {pageNavItems.map((item, i) =>
              item === null ? (
                <li
                  key={`gap-${i}`}
                  className="select-none px-1 font-sans text-sm text-muted"
                  aria-hidden="true"
                >
                  …
                </li>
              ) : (
                <li key={item}>
                  <Link
                    href={buildJobsPageUrl(resolvedBasePath, item)}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={`inline-flex min-h-11 min-w-11 items-center justify-center border px-2 py-2 font-sans text-sm ${
                      item === currentPage
                        ? "border-ink bg-surface font-semibold text-ink"
                        : "border-control text-secondary hover:border-ink hover:text-ink"
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
                  className="inline-flex min-h-11 items-center border border-control px-3 py-2 font-sans text-sm text-secondary hover:border-ink hover:text-ink"
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
