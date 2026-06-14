import plantsData from '../src/data/plants.json';

/**
 * Central nuclear-relevance filter for scraped jobs.
 *
 * Strategy (per approved plan — "nuclear roles + plant-support roles at a named site"):
 *  - Strong nuclear signal in title/description/department  -> keep, high confidence
 *  - Role physically at a known nuclear site, not excluded  -> keep (high if support role)
 *  - Clear non-nuclear signal (gas, transmission, retail…)  -> drop
 *  - Pure nuclear operator, no exclusion                    -> keep, low confidence (review)
 *  - Everything else (borderline)                           -> keep, low confidence (review)
 *
 * Borderline jobs are kept but flagged so they land in /dashboard/admin/review
 * with agent_confidence: 'low' rather than being silently published or dropped.
 */

export interface RelevanceInput {
  title: string;
  description?: string;
  department?: string;
  location?: string;
  companyId?: string;
}

export interface RelevanceVerdict {
  keep: boolean;
  confidence: 'high' | 'low';
  reason: string;
}

interface PlantRecord {
  id: string;
  name: string;
  state: string;
  city: string;
  operator: string;
  units?: { nrcName?: string }[];
}

const PLANTS = (plantsData as { plants: PlantRecord[] }).plants;

// Operators whose entire business is nuclear — a generic title from them is very
// likely nuclear-adjacent, so keep (low confidence) rather than drop.
const PURE_NUCLEAR_OPERATORS = new Set([
  'stp',
  'wolf-creek',
  'wolfcreek',
  'southern-nuclear',
  'energy-northwest',
  'constellation', // overwhelmingly nuclear-focused careers portal
]);

// Strong, unambiguous nuclear signals (phrase-level to avoid false hits like "gas fuel").
const STRONG_NUCLEAR = [
  'nuclear',
  'reactor',
  'radiolog',
  'radiation protection',
  'health physics',
  'i&c tech',
  'i & c',
  'instrumentation and control',
  'instrument tech',
  'nondestructive',
  'nde ',
  'reactor operator',
  'licensed operator',
  'senior reactor operator',
  ' sro',
  'fuel handling',
  'nuclear fuel',
  'fuels & core',
  'core design',
  'criticality',
  'dosimetry',
  'radwaste',
  'decontamination',
  'decon ',
  'rad protection',
  'rp tech',
  'hp tech',
  'isotope',
  'spent fuel',
];

// Clear non-nuclear signals from mixed-fleet utilities.
const EXCLUSIONS = [
  'natural gas',
  'gas controller',
  'gas operations',
  'pipeline',
  'transmission line',
  'transmission substation',
  'transmission trainee',
  'transmission equipment',
  'distribution line',
  'substation',
  'lineman',
  'line worker',
  'line technician',
  'retail',
  'lake services',
  'seasonal',
  'temp laborer',
  'temporary laborer',
  'customer field',
  'meter reader',
  'solar',
  'wind farm',
  'wind technician',
  'combustion turbine',
  'fossil',
  'coal ',
  'account executive',
];

// Support roles that count when physically at a nuclear site.
const SUPPORT_ROLE = [
  'maintenance',
  'mechanic',
  'electrician',
  'security',
  'technician',
  'engineer',
  'operator',
  'chemistry',
  'planner',
  'scheduler',
  'training',
  'instructor',
  'quality',
  'inspector',
  'specialist',
  'supervisor',
  'welder',
  'machinist',
];

function buildSiteMatchers() {
  const names: string[] = [];
  const cities: string[] = [];
  for (const p of PLANTS) {
    if (p.name) names.push(p.name.toLowerCase());
    if (p.city) cities.push(p.city.toLowerCase());
    for (const u of p.units || []) {
      if (u.nrcName) names.push(u.nrcName.toLowerCase());
    }
  }
  return { names: [...new Set(names)], cities: [...new Set(cities)] };
}

const SITES = buildSiteMatchers();

function anyIncludes(haystack: string, needles: string[]): string | null {
  for (const n of needles) {
    if (haystack.includes(n)) return n.trim();
  }
  return null;
}

export function scoreNuclearRelevance(job: RelevanceInput): RelevanceVerdict {
  const title = (job.title || '').toLowerCase();
  const dept = (job.department || '').toLowerCase();
  const loc = (job.location || '').toLowerCase();
  // Cap description weight — it's the weakest signal and can contain stray words.
  const desc = (job.description || '').toLowerCase().slice(0, 4000);
  const titleDept = `${title} ${dept}`;
  const full = `${title} ${dept} ${desc}`;

  // 1. Strong nuclear signal anywhere -> keep, high confidence (overrides exclusions).
  const strong = anyIncludes(titleDept, STRONG_NUCLEAR) || anyIncludes(desc, STRONG_NUCLEAR);
  if (strong) {
    return { keep: true, confidence: 'high', reason: `Strong nuclear signal: "${strong}"` };
  }

  const exclusion = anyIncludes(full, EXCLUSIONS);

  // 2. At a known nuclear site?
  const siteName = anyIncludes(`${title} ${loc} ${desc}`, SITES.names);
  const siteCity = anyIncludes(loc, SITES.cities);
  const atSite = siteName || siteCity;

  if (atSite) {
    if (exclusion) {
      return { keep: false, confidence: 'low', reason: `Non-nuclear role near a nuclear site: "${exclusion}"` };
    }
    const support = anyIncludes(title, SUPPORT_ROLE);
    if (support) {
      return { keep: true, confidence: 'high', reason: `Plant-support role at nuclear site (${siteName || siteCity})` };
    }
    return { keep: true, confidence: 'low', reason: `Role at nuclear site (${siteName || siteCity}), title unclear` };
  }

  // 3. Clear non-nuclear signal and not at a site -> drop.
  if (exclusion) {
    return { keep: false, confidence: 'low', reason: `Non-nuclear signal: "${exclusion}"` };
  }

  // 4. Pure nuclear operator with no exclusion -> keep but flag for review.
  if (job.companyId && PURE_NUCLEAR_OPERATORS.has(job.companyId)) {
    return { keep: true, confidence: 'low', reason: 'Pure nuclear operator, title unclear — review' };
  }

  // 5. Borderline -> keep low confidence so a human/AI reviews it.
  return { keep: true, confidence: 'low', reason: 'No clear nuclear or exclusion signal — review' };
}
