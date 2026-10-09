export const SITEMAP_BASE_URL = 'https://www.nuclearhustle.com';

/** YYYY-MM-DD of the most recent job, or undefined when there are none. */
export function newestJobDate(jobs: { scraped_at: string }[]): string | undefined {
  if (jobs.length === 0) return undefined;
  const newest = jobs.reduce((max, job) => (job.scraped_at > max ? job.scraped_at : max), '');
  return newest.split('T')[0];
}

/**
 * Omit lastmod rather than invent one: Google ignores lastmod site-wide once
 * it stops matching real content changes.
 */
export function lastmodTag(date: string | undefined): string {
  return date ? `\n    <lastmod>${date}</lastmod>` : '';
}

export function groupJobsBy<T>(jobs: T[], key: (job: T) => string | null | undefined) {
  const groups = new Map<string, T[]>();
  for (const job of jobs) {
    const k = key(job);
    if (!k) continue;
    const group = groups.get(k) ?? [];
    group.push(job);
    groups.set(k, group);
  }
  return groups;
}

export function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
