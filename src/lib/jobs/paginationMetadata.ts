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
  siteOrigin?: string;
  page1Title: string;
  page1Description: string;
  pagedTitle: (page: number, totalPages: number) => string;
  pagedDescription: (page: number, totalPages: number, totalJobs: number) => string;
}

export function buildJobsPaginationMetadata({
  pageParam,
  totalJobs,
  basePath,
  siteOrigin = 'https://nuclearhustle.com',
  page1Title,
  page1Description,
  pagedTitle,
  pagedDescription,
}: JobsPaginationMetadataOptions): Metadata {
  const page = parsePageParam(pageParam);
  const totalPages = getTotalPages(totalJobs);
  const safePage = Math.min(page, totalPages);
  const canonicalPath = buildJobsPageUrl(basePath, safePage);
  const canonical = `${siteOrigin}${canonicalPath}`;

  const isFirstPage = safePage === 1;

  return {
    title: isFirstPage ? page1Title : pagedTitle(safePage, totalPages),
    description: isFirstPage
      ? page1Description
      : pagedDescription(safePage, totalPages, totalJobs),
    alternates: { canonical },
    robots: page > totalPages ? { index: false, follow: true } : undefined,
  };
}
