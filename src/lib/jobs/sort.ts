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

type BoardJob = {
  company_id: string;
  is_featured?: boolean;
  featured_until?: string | null;
  scraped_at?: string | null;
};

/**
 * A crawl writes one scraped_at onto every job it touches. A plain time sort
 * is stable, so that tie keeps file order and the first company fills the
 * homepage. Round-robin companies inside a shared timestamp. A newer stamp
 * still ranks above an older one.
 */
export function orderByFeaturedThenNewest<T extends BoardJob>(
  jobs: readonly T[],
  now = new Date(),
): T[] {
  const sorted = [...jobs].sort((a, b) => compareFeaturedThenNewest(a, b, now));
  const out: T[] = [];

  let index = 0;
  while (index < sorted.length) {
    const head = sorted[index];
    const featured = isLiveFeatured(head, now);
    const stamp = head.scraped_at || "";
    let end = index + 1;
    while (
      end < sorted.length &&
      isLiveFeatured(sorted[end], now) === featured &&
      (sorted[end].scraped_at || "") === stamp
    ) {
      end++;
    }
    const run = sorted.slice(index, end);
    out.push(...(run.length > 1 ? interleaveByCompany(run) : run));
    index = end;
  }

  return out;
}

function interleaveByCompany<T extends { company_id: string }>(jobs: T[]): T[] {
  const queues: T[][] = [];
  const byCompany = new Map<string, T[]>();
  for (const job of jobs) {
    let queue = byCompany.get(job.company_id);
    if (!queue) {
      queue = [];
      byCompany.set(job.company_id, queue);
      queues.push(queue);
    }
    queue.push(job);
  }

  const out: T[] = [];
  let pending = true;
  while (pending) {
    pending = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (!next) continue;
      out.push(next);
      pending = true;
    }
  }
  return out;
}
