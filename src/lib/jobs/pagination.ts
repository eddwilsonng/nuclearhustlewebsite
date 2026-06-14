export const JOBS_PAGE_SIZE = 20;

export function parsePageParam(value: string | undefined): number {
  const page = parseInt(value ?? '1', 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
}

export function getTotalPages(totalItems: number, pageSize = JOBS_PAGE_SIZE): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function getVisibleCount(page: number, pageSize = JOBS_PAGE_SIZE): number {
  return page * pageSize;
}

export function buildJobsPageUrl(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}?page=${page}`;
}

/** Page numbers to show in SEO nav (with ellipsis gaps as null). */
export function getPageNavItems(currentPage: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | null)[] = [1];

  if (currentPage > 3) items.push(null);

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let p = start; p <= end; p++) items.push(p);

  if (currentPage < totalPages - 2) items.push(null);

  items.push(totalPages);
  return items;
}
