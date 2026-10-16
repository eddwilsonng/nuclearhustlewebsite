import plantsData from '@/data/plants.json';
import { jobFirstSeenAt } from '@/lib/email/firstSeen';
import { isPlaceholderLocation } from '@/lib/jobs/location';
import {
  extractState,
  getStateByCode,
  getStateBySlug,
  normalizeStateSlug,
  type StateInfo,
} from '@/lib/states';
import type { JobWithCompany, Region } from '@/lib/types';

const LEAD_CAP = 5;
const NEXT_CAP = 3;
const COMPANY_SHARE = 0.7;
const DIGEST_INTRO = 'These are the roles that went live this week.';

const REGION_RANK: Record<string, number> = {
  Midwest: 0,
  Southeast: 1,
  Northeast: 2,
  Southwest: 3,
  West: 4,
};

const STATE_REGION: Record<string, Region> = {
  illinois: 'Midwest',
  indiana: 'Midwest',
  iowa: 'Midwest',
  kansas: 'Midwest',
  michigan: 'Midwest',
  minnesota: 'Midwest',
  missouri: 'Midwest',
  nebraska: 'Midwest',
  'north-dakota': 'Midwest',
  ohio: 'Midwest',
  'south-dakota': 'Midwest',
  wisconsin: 'Midwest',
  connecticut: 'Northeast',
  delaware: 'Northeast',
  'district-of-columbia': 'Northeast',
  maine: 'Northeast',
  maryland: 'Northeast',
  massachusetts: 'Northeast',
  'new-hampshire': 'Northeast',
  'new-jersey': 'Northeast',
  'new-york': 'Northeast',
  pennsylvania: 'Northeast',
  'rhode-island': 'Northeast',
  vermont: 'Northeast',
  alabama: 'Southeast',
  arkansas: 'Southeast',
  florida: 'Southeast',
  georgia: 'Southeast',
  kentucky: 'Southeast',
  louisiana: 'Southeast',
  mississippi: 'Southeast',
  'north-carolina': 'Southeast',
  'south-carolina': 'Southeast',
  tennessee: 'Southeast',
  virginia: 'Southeast',
  'west-virginia': 'Southeast',
  arizona: 'Southwest',
  'new-mexico': 'Southwest',
  oklahoma: 'Southwest',
  texas: 'Southwest',
  alaska: 'West',
  california: 'West',
  colorado: 'West',
  hawaii: 'West',
  idaho: 'West',
  montana: 'West',
  nevada: 'West',
  oregon: 'West',
  utah: 'West',
  washington: 'West',
  wyoming: 'West',
};

const HIGH_INTENT =
  /reactor operator|\bsro\b|\bnlo\b|control room|nuclear engineer|health phys|radiation|licensed operator/i;

type PlantRecord = { name: string; city: string; state: string };

const PLANTS: PlantRecord[] = (plantsData as { plants: PlantRecord[] }).plants
  .slice()
  .sort((a, b) => b.name.length - a.name.length);

export interface DigestStateLink {
  name: string;
  slug: string;
  count: number;
}

export interface DigestSection {
  label: string;
  total: number;
  listed: JobWithCompany[];
  states: DigestStateLink[];
  otherStateCount: number;
}

export interface DigestModel {
  heading: string;
  intro: string;
  featured: JobWithCompany[];
  sections: DigestSection[];
  closer: string;
  browseLabel: string;
}

export interface DominantCompany {
  name: string;
  short: string;
  count: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stateFromLocation(location?: string | null): string | null {
  const extracted = extractState(location ?? '');
  if (extracted) return extracted;
  if (!location) return null;

  for (const match of location.matchAll(/,\s*([A-Z]{2})\b/g)) {
    const slug = getStateByCode(match[1])?.slug;
    if (slug) return slug;
  }
  return null;
}

function stateOf(job: JobWithCompany): StateInfo | null {
  const slug = normalizeStateSlug(job.state) ?? stateFromLocation(job.location);
  if (!slug) return null;
  return getStateBySlug(slug);
}

function regionForJob(job: JobWithCompany): Region | null {
  const state = stateOf(job);
  if (!state) return null;
  return STATE_REGION[state.slug] ?? null;
}

export function isFeaturedJob(job: JobWithCompany): boolean {
  return Boolean(
    job.is_featured && job.featured_until && new Date(job.featured_until) > new Date(),
  );
}

function cleanLocation(raw: string): string {
  return raw
    .replace(/,?\s*United States(?: of America)?/gi, '')
    .replace(/\s*\([A-Za-z]\)\s*$/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function formatDigestLocation(job: JobWithCompany): string {
  const raw = cleanLocation(job.location?.trim() ?? '');
  const state = stateOf(job);
  if (!raw || isPlaceholderLocation(raw)) return state?.code ?? '';
  if (!state) return raw;

  const codeRe = new RegExp(`\\b${state.code}\\b`, 'i');
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== state.name.toLowerCase())
    .map((part) => (codeRe.test(part) ? state.code : part));

  if (!parts.some((part) => part === state.code)) parts.push(state.code);
  return parts.join(', ');
}

export function digestPlantName(job: JobWithCompany): string | null {
  const title = job.title ?? '';
  for (const plant of PLANTS) {
    const re = new RegExp(`\\b${escapeRegExp(plant.name)}\\b`, 'i');
    if (re.test(title)) return plant.name;
  }

  const state = stateOf(job);
  const city = formatDigestLocation(job).split(',')[0]?.trim();
  if (!state || !city) return null;

  const match = PLANTS.find(
    (plant) =>
      plant.state.toUpperCase() === state.code &&
      plant.city.toLowerCase() === city.toLowerCase(),
  );
  return match?.name ?? null;
}

export function digestRowMeta(job: JobWithCompany, options?: { markFeatured?: boolean }): string {
  const location = formatDigestLocation(job);
  const city = location.split(',')[0]?.trim() ?? '';
  const plant = digestPlantName(job);
  const place = [plant && plant.toLowerCase() !== city.toLowerCase() ? plant : '', location]
    .filter(Boolean)
    .join(', ');
  const parts: string[] = [];

  if (options?.markFeatured !== false && isFeaturedJob(job)) parts.push('Featured');
  if (place) parts.push(place);
  if (job.company.name) parts.push(job.company.name);
  return parts.join(' · ');
}

function rankedCompanies(jobs: JobWithCompany[]): DominantCompany[] {
  const counts = new Map<string, DominantCompany>();
  for (const job of jobs) {
    const key = job.company.id || job.company.name;
    const current = counts.get(key) ?? {
      name: job.company.name,
      short: shortenCompany(job.company.name),
      count: 0,
    };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function shortenCompany(name: string): string {
  return name
    .replace(/\s+(energy|power|nuclear|corporation|corp\.?|inc\.?|llc|company|co\.?)$/i, '')
    .trim();
}

export function dominantCompany(jobs: JobWithCompany[]): DominantCompany | null {
  if (jobs.length === 0) return null;
  const top = rankedCompanies(jobs)[0];
  if (!top || top.count / jobs.length < COMPANY_SHARE) return null;
  if (!top.short || top.short.length > 16) return { ...top, short: '' };
  return top;
}

export function digestStateCodes(jobs: JobWithCompany[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const state = stateOf(job);
    if (!state) continue;
    counts.set(state.code, (counts.get(state.code) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([code]) => code);
}

export function digestHeading(jobs: JobWithCompany[]): string {
  if (jobs.length === 0) return 'No new roles this week';
  const noun = jobs.length === 1 ? 'role' : 'roles';
  return `${jobs.length} new ${noun} this week`;
}

export function jobPriority(job: JobWithCompany): number {
  let score = 0;
  if (isFeaturedJob(job)) score += 100;
  if (HIGH_INTENT.test(job.title)) score += 35;
  if (job.category === 'operations') score += 25;
  else if (job.category === 'engineering') score += 10;
  return score;
}

function compareJobs(a: JobWithCompany, b: JobWithCompany): number {
  const scoreDiff = jobPriority(b) - jobPriority(a);
  if (scoreDiff !== 0) return scoreDiff;
  return new Date(jobFirstSeenAt(b)).getTime() - new Date(jobFirstSeenAt(a)).getTime();
}

export function pickDigestHero(jobs: JobWithCompany[]): JobWithCompany | null {
  if (jobs.length === 0) return null;
  return [...jobs].sort(compareJobs)[0];
}

function siteKey(job: JobWithCompany): string {
  return digestPlantName(job) ?? (formatDigestLocation(job) || job.id);
}

function titleKey(job: JobWithCompany): string {
  return job.title
    .split(/\s[-–—|]\s/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function pickListed(jobs: JobWithCompany[], limit: number): JobWithCompany[] {
  const sorted = [...jobs].sort(compareJobs);
  if (sorted.length <= limit) return sorted;

  const picked: JobWithCompany[] = [];
  const seenTitles = new Set<string>();
  const seenSites = new Set<string>();
  const seenCompanies = new Set<string>();

  for (const job of sorted) {
    const company = job.company.id || job.company.name;
    const title = titleKey(job);
    if (seenCompanies.has(company) || seenTitles.has(title)) continue;
    seenCompanies.add(company);
    seenTitles.add(title);
    seenSites.add(siteKey(job));
    picked.push(job);
    if (picked.length === limit) return picked;
  }

  for (const job of sorted) {
    const title = titleKey(job);
    if (seenTitles.has(title) || picked.some((item) => item.id === job.id)) continue;
    seenTitles.add(title);
    seenSites.add(siteKey(job));
    picked.push(job);
    if (picked.length === limit) return picked;
  }

  for (const job of sorted) {
    if (picked.some((item) => item.id === job.id)) continue;
    const site = siteKey(job);
    if (seenSites.has(site)) continue;
    seenSites.add(site);
    picked.push(job);
    if (picked.length === limit) return picked;
  }

  for (const job of sorted) {
    if (picked.some((item) => item.id === job.id)) continue;
    picked.push(job);
    if (picked.length === limit) break;
  }

  return picked;
}

function stateCounts(jobs: JobWithCompany[]): DigestStateLink[] {
  const counts = new Map<string, DigestStateLink>();
  for (const job of jobs) {
    const state = stateOf(job);
    if (!state) continue;
    const current = counts.get(state.slug) ?? { name: state.name, slug: state.slug, count: 0 };
    current.count += 1;
    counts.set(state.slug, current);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function joinClauses(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function describeSection(section: DigestSection): string {
  const bits = section.states.map((state) => `${state.count} in ${state.name}`);
  let where = joinClauses(bits);
  if (section.otherStateCount > 0) {
    const noun = section.otherStateCount === 1 ? 'state' : 'states';
    where = where ? `${where}, plus ${section.otherStateCount} other ${noun}` : `${section.otherStateCount} other ${noun}`;
  }
  const noun = section.total === 1 ? 'role' : 'roles';
  return where ? `${section.total} new ${noun}. ${where}.` : `${section.total} new ${noun}.`;
}

function liveFeatured(jobs: JobWithCompany[]): JobWithCompany[] {
  const byId = new Map<string, JobWithCompany>();
  for (const job of jobs) {
    if (!isFeaturedJob(job) || byId.has(job.id)) continue;
    byId.set(job.id, job);
  }
  return [...byId.values()].sort(compareJobs);
}

export function buildDigestModel(
  jobs: JobWithCompany[],
  featured: JobWithCompany[] = [],
): DigestModel {
  const featuredJobs = liveFeatured([...featured, ...jobs]);
  const featuredIds = new Set(featuredJobs.map((job) => job.id));

  const grouped = new Map<string, JobWithCompany[]>();
  for (const job of jobs) {
    const key = regionForJob(job) ?? 'Other';
    const list = grouped.get(key) ?? [];
    list.push(job);
    grouped.set(key, list);
  }

  const keys = [...grouped.keys()]
    .filter((key) => key !== 'Other')
    .sort((a, b) => {
      const countDiff = (grouped.get(b)?.length ?? 0) - (grouped.get(a)?.length ?? 0);
      if (countDiff !== 0) return countDiff;
      return (REGION_RANK[a] ?? 9) - (REGION_RANK[b] ?? 9);
    });

  const sections = keys.map((key, index) => {
    const regionJobs = grouped.get(key) ?? [];
    const states = stateCounts(regionJobs);
    return {
      label: key,
      total: regionJobs.length,
      listed: pickListed(
        regionJobs.filter((job) => !featuredIds.has(job.id)),
        index === 0 ? LEAD_CAP : NEXT_CAP,
      ),
      states: states.slice(0, 4),
      otherStateCount: Math.max(0, states.length - 4),
    };
  });

  const unlocated = grouped.get('Other')?.length ?? 0;

  return {
    heading: digestHeading(jobs),
    intro: jobs.length === 0 ? '' : DIGEST_INTRO,
    featured: featuredJobs,
    sections,
    closer:
      unlocated > 0 && sections.length > 0
        ? `${unlocated} ${unlocated === 1 ? 'listing has' : 'listings have'} no US state on the posting.`
        : '',
    browseLabel: jobs.length === 0 ? 'Browse open roles' : `Browse all ${jobs.length}`,
  };
}
