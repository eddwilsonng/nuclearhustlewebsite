/**
 * Local (no API) relevance pass over pending_review jobs.
 * Title + plant-site first. Mixed-fleet utilities only publish with a
 * nuclear/site signal. Run: npx tsx scraper/review-local.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import plantsData from '../src/data/plants.json';
import { submitToIndexNow, jobUrl } from '../src/lib/indexnow';

const JOBS_PATH = path.join(__dirname, '..', 'src', 'data', 'jobs.json');

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
]);

const REJECT_RE =
  /\b(hydro|bess|solar|natural gas|transmission|lineman|line worker|right of way|hvac|retail|advocacy|trading|credit risk|customer solutions|pipeline|fossil|coal |wind farm|keowee|meter reader|lake services)\b/i;

const STRONG_RE =
  /\b(nuclear|reactor|radiolog|radiation|health physics|sro\b|i&c|i & c|instrumentation and control|criticality|radwaste|fuel handling|neutronic|dosimetr|rp tech|licensed operator|refueling|spent fuel|nde |outage|pwr\b|bwr\b|smr\b)\b/i;

interface Plant {
  name: string;
  city: string;
  units?: { nrcName?: string }[];
}

const plants = (plantsData as { plants: Plant[] }).plants;
const siteNeedles = [
  ...new Set(
    plants.flatMap((p) =>
      [p.name, p.city, ...(p.units || []).map((u) => u.nrcName || '')]
        .filter(Boolean)
        .map((s) => s.toLowerCase())
    )
  ),
].filter((s) => s.length > 3);

function atSite(text: string): boolean {
  const t = text.toLowerCase();
  return siteNeedles.some((n) => t.includes(n));
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

  if (REJECT_RE.test(hay) && !STRONG_RE.test(title)) {
    return { verdict: 'reject', reason: 'Non-nuclear signal in title/location' };
  }
  if (REJECT_RE.test(title)) {
    return { verdict: 'reject', reason: 'Non-nuclear title' };
  }

  if (STRONG_RE.test(title)) {
    return { verdict: 'publish', reason: 'Nuclear signal in title' };
  }

  if (atSite(`${title} ${job.location || ''}`)) {
    return { verdict: 'publish', reason: 'Role at a named nuclear site' };
  }

  if (MIXED.has(job.company_id)) {
    // Description can mention "nuclear" as corporate boilerplate — don't trust it.
    return { verdict: 'reject', reason: 'Mixed-fleet utility, no nuclear title or site' };
  }

  // Pure / vendor companies (Westinghouse, Oklo, TerraPower, …): keep for a look
  // unless the title is obviously unrelated.
  if (/\b(sharepoint|accounts payable|workday systems|insurance and enterprise)\b/i.test(title)) {
    return { verdict: 'reject', reason: 'Corporate/back-office, not a nuclear role' };
  }

  return { verdict: 'flag', reason: 'Nuclear-industry employer, title unclear' };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8')) as {
    jobs: Array<{
      id: string;
      title: string;
      location?: string;
      description?: string;
      company_id: string;
      slug: string;
      status?: string;
      review_notes?: string;
      agent_confidence?: string;
    }>;
  };

  const published: { title: string; company_id: string; slug: string }[] = [];
  const rejected: { title: string; company_id: string; reason: string }[] = [];
  const flagged: { title: string; company_id: string; reason: string }[] = [];

  for (const job of data.jobs) {
    if (job.status !== 'pending_review') continue;
    const { verdict, reason } = decide(job);
    if (verdict === 'publish') {
      job.status = 'published';
      job.review_notes = `Local review: ${reason}`;
      job.agent_confidence = 'high';
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
