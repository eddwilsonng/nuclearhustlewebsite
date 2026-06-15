import type { Metadata } from 'next';
import {
  parsePageParam,
  getTotalPages,
  buildJobsPageUrl,
} from './pagination';

interface JobsPaginationMetadataOptions {
  pageParam?: string;
  totalJobs: number;
  basePath: string;
  page1Title: string;
  page1Description: string;
  pagedTitle: (page: number, totalPages: number) => string;
  pagedDescription: (page: number, totalPages: number, totalJobs: number) => string;
}

export function buildJobsPaginationMetadata({
  pageParam,
  totalJobs,
  basePath,
  page1Title,
  page1Description,
  pagedTitle,
  pagedDescription,
}: JobsPaginationMetadataOptions): Metadata {
  const page = parsePageParam(pageParam);
  const totalPages = getTotalPages(totalJobs);
  const safePage = Math.min(page, totalPages);
  // Relative canonical — resolved against metadataBase (www) by Next.
  const canonical = buildJobsPageUrl(basePath, safePage);

  const isFirstPage = safePage === 1;

  return {
    title: isFirstPage ? page1Title : pagedTitle(safePage, totalPages),
    description: isFirstPage
      ? page1Description
      : pagedDescription(safePage, totalPages, totalJobs),
    alternates: { canonical },
    // noindex empty programmatic pages (zero listings) and out-of-range pages —
    // keep following so crawl equity still flows through their links.
    robots:
      totalJobs === 0 || page > totalPages
        ? { index: false, follow: true }
        : undefined,
  };
}
