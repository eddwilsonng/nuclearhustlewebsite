/** Live featured window. Shared so every board sorts the same way. */
export function isLiveFeatured(
  job: { is_featured?: boolean; featured_until?: string | null },
  now = new Date(),
): boolean {
  return !!(
    job.is_featured &&
    job.featured_until &&
    new Date(job.featured_until) > now
  );
}

/**
 * Featured listings stay at the top for the whole paid window, then newest.
 * `now` is injectable so callers can share one timestamp across a sort.
 */
export function compareFeaturedThenNewest<
  T extends {
    is_featured?: boolean;
    featured_until?: string | null;
    scraped_at?: string | null;
  },
>(a: T, b: T, now = new Date()): number {
  const featured = Number(isLiveFeatured(b, now)) - Number(isLiveFeatured(a, now));
  if (featured !== 0) return featured;
  return new Date(b.scraped_at || 0).getTime() - new Date(a.scraped_at || 0).getTime();
}
