/**
 * Local (no API) relevance pass over pending_review jobs.
 * Title + plant-site first. Mixed-fleet utilities only publish with a
 * nuclear/site signal. Run: npx tsx scraper/review-local.ts
 *
 * Manual verdicts (e.g. a human / in-editor agent review) override the rules:
 *   npx tsx scraper/review-local.ts --verdicts=path/to/verdicts.json
 * where the file is { "<job id>": { "verdict": "publish" | "reject" | "flag", "reason": "..." } }.
 * Jobs not in the file are left untouched.
 */
import * as fs from 'fs';
import * as path from 'path';
import plantsData from '../src/data/plants.json';
import { submitToIndexNow, jobUrl } from '../src/lib/indexnow';
import {
  formatJobDescriptionLocal,
  isMixedFleetFalsePositive,
} from '../src/lib/formatJobDescriptionLocal';
import { applyGeneratedFit } from '../src/lib/jobs/generateFit';
import { resolveJobLocation } from '../src/lib/jobs/location';
import { extractState, normalizeStateSlug } from '../src/lib/states';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');
const COMPANIES_PATH = path.join(__dirname, '..', 'src', 'data', 'companies.json');

function loadCompanyNames(): Map<string, string> {
  try {
    const data = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf-8')) as {
      companies: { id: string; name: string }[];
    };
    return new Map(data.companies.map((c) => [c.id, c.name]));
  } catch {
    return new Map();
  }
}

const MIXED = new Set([
  'duke',
  'dominion',
  'entergy',
  'constellation',
  'ameren',
  'dte',
  'aep',
  'pseg',
  'xcel',
  'aps',
  'pge',
  'talen',
  'nextera',
]);

const REJECT_RE =
  /\b(hydro|bess|solar|natural gas|transmission|lineman|line worker|right of way|hvac|retail|advocacy|trading|credit risk|customer solutions|pipeline|fossil|coal |wind farm|keowee|meter reader|lake services|renewables|janitorial|hv technician|sheldon station|gas sales|transportation analyst|hr generalist|hr business partner|talent acquisition)\b/i;

const STRONG_RE =
  /\b(nuclear|reactor|radiolog|radiation|health physics|sro\b|i&c|i & c|instrumentation and control|criticality|radwaste|fuel handling|neutronic|dosimetr|rp tech|licensed operator|refueling|spent fuel|nde |outage|pwr\b|bwr\b|smr\b)\b/i;

// Bare "I&C" shows up on gas-plant maintenance. These are the signals that
// still mean nuclear when the role is not at a plant site.
const NUCLEAR_STRONG_RE =
  /\b(nuclear|reactor|radiolog|radiation|health physics|sro\b|instrumentation and control|criticality|radwaste|fuel handling|neutronic|dosimetr|rp tech|licensed operator|refueling|spent fuel|nde |outage|pwr\b|bwr\b|smr\b)\b/i;

interface Plant {
  name: string;
  city: string;
  state?: string;
  units?: { nrcName?: string }[];
}

// NRC short name "Summer" is V.C. Summer. Substring "summer" matches every
// "Summer 2027" internship. Keep "v.c. summer" / Jenkinsville instead.
const AMBIGUOUS_SITE = new Set(['summer']);

type SiteNeedle = { text: string; state: string | null };

const plants = (plantsData as { plants: Plant[] }).plants;
const siteNeedles: SiteNeedle[] = [];
const seenNeedles = new Set<string>();
for (const plant of plants) {
  const state = normalizeStateSlug(plant.state);
  const bits = [plant.name, plant.city, ...(plant.units || []).map((u) => u.nrcName || '')];
  for (const bit of bits) {
    const text = bit.toLowerCase().trim();
    if (text.length <= 3 || AMBIGUOUS_SITE.has(text)) continue;
    const key = `${text}|${state ?? ''}`;
    if (seenNeedles.has(key)) continue;
    seenNeedles.add(key);
    siteNeedles.push({ text, state });
  }
}

// Towns career sites use that are not the NRC city name.
for (const alias of [
  { text: 'oswego', state: 'new-york' },
  { text: 'pottstown', state: 'pennsylvania' },
  { text: 'braceville', state: 'illinois' },
]) {
  siteNeedles.push(alias);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function needleHits(needle: string, text: string): boolean {
  return new RegExp(`(?:^|[^a-z0-9])${escapeRe(needle)}(?:[^a-z0-9]|$)`, 'i').test(text);
}

function atSite(title: string, location?: string): boolean {
  const loc = location || '';
  const locState = extractState(loc);
  const hay = `${title} ${loc}`.toLowerCase();
  return siteNeedles.some((n) => {
    if (!needleHits(n.text, hay)) return false;
    if (!n.state || !locState) return true;
    // City matched inside the location line — require the same state.
    // Stops "Clover, VA" hitting Catawba (Clover, SC).
    if (!needleHits(n.text, loc.toLowerCase())) return true;
    return locState === n.state;
  });
}

type Verdict = 'publish' | 'reject' | 'flag';

function decide(job: {
  title: string;
  location?: string;
  description?: string;
  company_id: string;
}): { verdict: Verdict; reason: string } {
  const hay = `${job.title} ${job.location || ''} ${job.company_id}`;
  const title = job.title;

  if (/\bgeneral application\b|\bopen call\b/i.test(title)) {
    return { verdict: 'reject', reason: 'Talent-pool / general application, not a listing' };
  }

  if (
    /,\s*(SE|FR|ES|DE|UK|CZ|BE|PL|NL|JP|KR)\s*$/i.test(job.location || '') ||
    /\b(sweden|västerås|vasteras|france|spain|germany|united kingdom|czech republic|belgium)\b/i.test(
      job.location || '',
    )
  ) {
    return { verdict: 'flag', reason: 'Outside the US' };
  }

  if (REJECT_RE.test(hay) && !STRONG_RE.test(title)) {
    return { verdict: 'reject', reason: 'Non-nuclear signal in title/location' };
  }
  if (REJECT_RE.test(title)) {
    return { verdict: 'reject', reason: 'Non-nuclear title' };
  }

  if (STRONG_RE.test(title)) {
    if (isMixedFleetFalsePositive(job)) {
      return { verdict: 'reject', reason: 'Mixed-fleet PMC/generation role, not a nuclear plant listing' };
    }
    const bareIc = /\bi\s*&?\s*c\b/i.test(title) && !NUCLEAR_STRONG_RE.test(title);
    if (bareIc && MIXED.has(job.company_id) && !atSite(title, job.location)) {
      const desc = job.description || '';
      const gas = /\b(gas turbine|combined cycle|wind farm|solar farm|renewable)\b/i.test(desc);
      const nuclear = /\bnuclear\b/i.test(desc);
      if (gas && !nuclear) {
        return { verdict: 'reject', reason: 'I&C title on a non-nuclear generation role' };
      }
    }
    return { verdict: 'publish', reason: 'Nuclear signal in title' };
  }

  if (atSite(title, job.location)) {
    return { verdict: 'publish', reason: 'Role at a named nuclear site' };
  }

  if (MIXED.has(job.company_id)) {
    // Description can mention "nuclear" as corporate boilerplate — don't trust it.
    return { verdict: 'reject', reason: 'Mixed-fleet utility, no nuclear title or site' };
  }

  // Pure / vendor companies (Westinghouse, Oklo, TerraPower, …): keep for a look
  // unless the title is obviously unrelated.
  if (
    /\b(sharepoint|accounts payable|workday systems|insurance and enterprise|finance|financial|accountant|accounting|auditor|payroll|recruiter)\b/i.test(
      title,
    )
  ) {
    return { verdict: 'reject', reason: 'Corporate/back-office, not a nuclear role' };
  }

  return { verdict: 'flag', reason: 'Nuclear-industry employer, title unclear' };
}

type ManualVerdicts = Record<string, { verdict: Verdict; reason: string }>;

function loadManualVerdicts(): ManualVerdicts | null {
  const arg = process.argv.find((a) => a.startsWith('--verdicts='));
  if (!arg) return null;
  const file = path.resolve(arg.slice('--verdicts='.length));
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as ManualVerdicts;
}

async function main() {
  const manual = loadManualVerdicts();
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as {
    jobs: Array<{
      id: string;
      title: string;
      location?: string;
      description?: string;
      company_id: string;
      slug: string;
      category?: string;
      state?: string | null;
      status?: string;
      review_notes?: string;
      agent_confidence?: string;
      structured_description?: unknown;
    }>;
  };

  const companyNames = loadCompanyNames();
  const published: { title: string; company_id: string; slug: string }[] = [];
  const rejected: { title: string; company_id: string; reason: string }[] = [];
  const flagged: { title: string; company_id: string; reason: string }[] = [];

  for (const job of data.jobs) {
    if (job.status !== 'pending_review') continue;
    if (manual && !manual[job.id]) continue;
    if (!manual) {
      const resolved = resolveJobLocation(job);
      if (resolved) {
        job.location = resolved.location;
        if (resolved.state) job.state = resolved.state;
      }
    }
    const { verdict, reason } = manual
      ? { verdict: manual[job.id].verdict, reason: `Manual review: ${manual[job.id].reason}` }
      : decide(job);
    if (verdict === 'publish') {
      if (!job.description || job.description.length < 80) {
        job.review_notes = `Local review: ${reason} — held, no description to format`;
        job.agent_confidence = 'low';
        flagged.push({ title: job.title, company_id: job.company_id, reason: 'No description' });
        continue;
      }
      const resolved = resolveJobLocation(job);
      if (resolved) {
        job.location = resolved.location;
        if (resolved.state) job.state = resolved.state;
      }
      job.status = 'published';
      job.review_notes = `Local review: ${reason}`;
      job.agent_confidence = 'high';
      const sd = formatJobDescriptionLocal(job.description, job.title);
      job.structured_description = applyGeneratedFit(sd, {
        title: job.title,
        companyName: companyNames.get(job.company_id) ?? job.company_id,
        location: job.location,
        category: job.category,
        description: job.description,
      });
      published.push({ title: job.title, company_id: job.company_id, slug: job.slug });
    } else if (verdict === 'reject') {
      job.status = 'rejected';
      job.review_notes = `Local review: ${reason}`;
      job.agent_confidence = 'low';
      rejected.push({ title: job.title, company_id: job.company_id, reason });
    } else {
      job.review_notes = `Local review: ${reason}`;
      job.agent_confidence = 'low';
      flagged.push({ title: job.title, company_id: job.company_id, reason });
    }
  }

  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2) + '\n');
  await submitToIndexNow(published.map((j) => jobUrl(j.slug)));

  console.log(`Published ${published.length}`);
  console.log(`Rejected ${rejected.length}`);
  console.log(`Flagged ${flagged.length} (still pending)\n`);

  console.log('--- published ---');
  for (const j of published) {
    console.log(`  ${j.company_id.padEnd(18)} ${j.title.slice(0, 72)}`);
  }
  console.log('\n--- flagged ---');
  for (const j of flagged) {
    console.log(`  ${j.company_id.padEnd(18)} ${j.title.slice(0, 72)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
