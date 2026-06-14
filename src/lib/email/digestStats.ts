import { getCategoryInfo, JobCategory } from '@/lib/categorize';
import { getStateBySlug } from '@/lib/states';
import type { JobWithCompany } from '@/lib/types';
import { isNewThisWeek } from './formatPostedLabel';

export interface DigestStats {
  totalJobs: number;
  stateCount: number;
  topStates: string[];
  topCategories: string[];
  topCategoryHiring: string;
  newThisWeek: number;
}

function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function topN(map: Map<string, number>, n: number): string[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key]) => key);
}

export function computeDigestStats(jobs: JobWithCompany[]): DigestStats {
  const stateCounts = countBy(jobs, (j) => {
    if (!j.state) return null;
    return getStateBySlug(j.state)?.name ?? j.state;
  });

  const categoryCounts = countBy(jobs, (j) =>
    j.category !== 'other' ? getCategoryInfo(j.category).name : null
  );

  const topStates = topN(stateCounts, 3);
  const topCategories = topN(categoryCounts, 4);
  const topCategoryEntry = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  return {
    totalJobs: jobs.length,
    stateCount: stateCounts.size,
    topStates,
    topCategories,
    topCategoryHiring: topCategoryEntry ? topCategoryEntry[0] : 'Operations',
    newThisWeek: jobs.filter((j) => isNewThisWeek(j.scraped_at)).length,
  };
}

export const CATEGORY_ORDER: JobCategory[] = [
  'operations',
  'engineering',
  'maintenance',
  'health-physics',
  'security',
  'training',
  'administrative',
  'other',
];
