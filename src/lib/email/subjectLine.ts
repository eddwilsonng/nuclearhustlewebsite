import { getStateBySlug, US_STATES } from '@/lib/states';
import type { JobWithCompany } from '@/lib/types';
import { computeDigestStats, DigestStats } from './digestStats';
import { isNewThisWeek } from './formatPostedLabel';

const MAX_SUBJECT_LENGTH = 52;

const HIGH_INTENT_TITLE = /reactor operator|\bsro\b|\bnlo\b|control room|nuclear engineer|health phys|radiation|licensed operator/i;

function stateCode(job: JobWithCompany): string | null {
  if (!job.state) return null;
  return getStateBySlug(job.state)?.code ?? null;
}

function shorten(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function shortenTitle(title: string, max = 34): string {
  return shorten(
    title
      .replace(/\s*[-–—|]\s*.+$/, '')
      .replace(/\s*\(.+\)$/, '')
      .trim(),
    max
  );
}

function shortenCompany(name: string): string {
  return shorten(
    name
      .replace(/\s+(energy|power|nuclear|corporation|corp\.?|inc\.?|llc)$/i, '')
      .trim(),
    16
  );
}

function formatStateList(stats: DigestStats): string {
  if (stats.topStates.length === 0) return 'US plants';

  return stats.topStates
    .slice(0, 3)
    .map((name) => US_STATES.find((s) => s.name === name)?.code ?? shorten(name, 10))
    .join(', ');
}

function formatCategoryPair(stats: DigestStats): string {
  if (stats.topCategories.length >= 2) {
    return `${stats.topCategories[0].toLowerCase()} & ${stats.topCategories[1].toLowerCase()}`;
  }
  return stats.topCategories[0]?.toLowerCase() ?? 'nuclear';
}

function moreSuffix(total: number): string {
  if (total <= 1) return '';
  return ` (+${total - 1} more)`;
}

function fitSubject(base: string, suffix = ''): string {
  const combined = `${base}${suffix}`;
  if (combined.length <= MAX_SUBJECT_LENGTH) return combined;

  const budget = MAX_SUBJECT_LENGTH - suffix.length;
  return `${shorten(base, Math.max(budget, 20))}${suffix}`;
}

function scoreHeroJob(job: JobWithCompany): number {
  let score = 0;

  if (job.is_featured && job.featured_until && new Date(job.featured_until) > new Date()) {
    score += 100;
  }
  if (job.isEmployerJob) score += 50;
  if (job.category === 'operations') score += 25;
  if (HIGH_INTENT_TITLE.test(job.title)) score += 35;
  if (isNewThisWeek(job.scraped_at)) score += 10;

  return score;
}

function pickHeroJob(jobs: JobWithCompany[]): JobWithCompany {
  return [...jobs].sort((a, b) => {
    const scoreDiff = scoreHeroJob(b) - scoreHeroJob(a);
    if (scoreDiff !== 0) return scoreDiff;
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  })[0];
}

function heroSubject(hero: JobWithCompany, total: number): string {
  const suffix = moreSuffix(total);
  const suffixLen = suffix.length;
  const titleBudget = MAX_SUBJECT_LENGTH - suffixLen;
  const title = shortenTitle(hero.title, Math.min(34, titleBudget - 12));
  const company = shortenCompany(hero.company.name);
  const st = stateCode(hero);

  const candidates = [
    st ? `${title} — ${company}, ${st}${suffix}` : `${title} — ${company}${suffix}`,
    st ? `${title}, ${st}${suffix}` : null,
    `${shortenTitle(hero.title, titleBudget)}${suffix}`,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate.length <= MAX_SUBJECT_LENGTH) return candidate;
  }

  return `${shortenTitle(hero.title, titleBudget)}${suffix}`;
}

function freshnessSubject(stats: DigestStats): string {
  const states = formatStateList(stats);
  const base = `${stats.newThisWeek} new nuclear jobs — ${states}`;
  return fitSubject(base);
}

function volumeSubject(stats: DigestStats): string {
  const categories = formatCategoryPair(stats);
  const states = formatStateList(stats);
  const base = `${stats.totalJobs} ${categories} roles — ${states}`;
  return fitSubject(base);
}

function fallbackSubject(stats: DigestStats): string {
  const states = formatStateList(stats);
  return fitSubject(`${stats.totalJobs} open nuclear roles — ${states}`);
}

function isGenericTitle(title: string): boolean {
  const normalized = title.trim();
  if (HIGH_INTENT_TITLE.test(normalized)) return false;
  const words = normalized.split(/\s+/);
  return words.length <= 2;
}

/**
 * Subject line strategy (priority order):
 * 1. Hero job — specific role + company + state (+N more)
 * 2. Freshness — when most jobs are new and hero title is too generic
 * 3. Volume + category + geography
 */
export function weeklyDigestSubject(jobs: JobWithCompany[]): string {
  if (jobs.length === 0) return 'Open nuclear roles this week';

  const stats = computeDigestStats(jobs);
  const hero = pickHeroJob(jobs);

  // Specific titles outperform generic counts — always lead with a real role when possible
  if (!isGenericTitle(hero.title) || jobs.length <= 4) {
    return heroSubject(hero, jobs.length);
  }

  if (stats.newThisWeek >= Math.ceil(stats.totalJobs * 0.75) && stats.newThisWeek >= 5) {
    return freshnessSubject(stats);
  }

  if (stats.totalJobs >= 5) {
    return volumeSubject(stats);
  }

  return fallbackSubject(stats);
}

export function weeklyDigestPreheader(jobs: JobWithCompany[]): string {
  if (jobs.length === 0) return 'Reactor operators, engineers, and plant roles updated weekly.';

  const stats = computeDigestStats(jobs);
  const hero = pickHeroJob(jobs);
  const subject = weeklyDigestSubject(jobs);
  const heroUsed = subject.includes(shortenTitle(hero.title).slice(0, 12));

  if (heroUsed && jobs.length > 1) {
    const categories = stats.topCategories.slice(0, 3).join(', ').toLowerCase();
    const stateLabel = stats.stateCount === 1 ? '1 state' : `${stats.stateCount} states`;
    return `Plus ${jobs.length - 1} more this week — ${categories} across ${stateLabel}.`;
  }

  if (stats.newThisWeek >= 3) {
    const teaser = shortenTitle(hero.title);
    return `Including ${teaser} — ${stats.totalJobs} roles across ${stats.stateCount} states.`;
  }

  const topCategory = stats.topCategoryHiring.toLowerCase();
  const states = formatStateList(stats);
  return `${stats.totalJobs} ${topCategory} and more — ${states}.`;
}
