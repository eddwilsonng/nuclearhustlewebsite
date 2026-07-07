import { createClient } from '@/lib/supabase/server';
import { getAnyJobBySlug } from '@/lib/data/employer';
import type { JobWithCompany } from '@/lib/types';

export interface PublishedWeek {
  weekId: string;
  publishedAt: string;
  jobs: JobWithCompany[];
}

/**
 * Latest published weekly set. Reads the most-recent `weekly_picks` row (so the
 * page still works before the current week is published), resolves each slug
 * back to a live job, and drops any that have since expired or been removed —
 * order is preserved. Returns null when nothing is published or nothing resolves.
 */
export async function getPublishedWeek(): Promise<PublishedWeek | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('weekly_picks')
    .select('week_id, job_slugs, published_at')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const slugs = Array.isArray(data.job_slugs) ? (data.job_slugs as string[]) : [];
  const resolved = await Promise.all(slugs.map((slug) => getAnyJobBySlug(slug)));
  const jobs = resolved.filter((j): j is JobWithCompany => Boolean(j));

  if (jobs.length === 0) return null;

  return {
    weekId: data.week_id as string,
    publishedAt: data.published_at as string,
    jobs,
  };
}
