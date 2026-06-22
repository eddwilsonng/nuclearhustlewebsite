import { Metadata } from 'next';
import Link from 'next/link';
import jobsData from '@/data/jobs.json';
import { groupSkills } from '@/lib/skills/taxonomy';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseDescription,
} from '@/components/BrowsePageHeader';

// ── Data computation (runs at build time) ────────────────────────────────────

type Job = {
  status?: string;
  category?: string;
  structured_description?: { skills?: string[] };
};

const jobs: Job[] = (jobsData as { jobs: Job[] }).jobs.filter(
  (j) => !j.status || j.status === 'published'
);

type Ranked = { name: string; count: number };

/**
 * Count canonical certifications / clearances / skills across a job set, using
 * the shared taxonomy so variants collapse and facets stay separate. Counts are
 * per-job (deduped within a job), so a count is "listings that asked for it".
 */
function aggregateFacets(set: Job[]) {
  const certs = new Map<string, number>();
  const clears = new Map<string, number>();
  const skills = new Map<string, number>();
  const bump = (m: Map<string, number>, n: string) => m.set(n, (m.get(n) ?? 0) + 1);

  for (const j of set) {
    const g = groupSkills(j.structured_description?.skills ?? []);
    g.certifications.forEach((n) => bump(certs, n));
    g.clearances.forEach((n) => bump(clears, n));
    g.skills.forEach((n) => bump(skills, n));
  }

  const rank = (m: Map<string, number>): Ranked[] =>
    [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  return { certifications: rank(certs), clearances: rank(clears), skills: rank(skills) };
}

const jobsWithSkills = jobs.filter((j) => (j.structured_description?.skills?.length ?? 0) > 0);
const { certifications, clearances, skills } = aggregateFacets(jobs);
const topSkills = skills.slice(0, 20);
const topCert = certifications[0];

const CATEGORIES: Record<string, string> = {
  engineering: 'Engineering',
  operations: 'Operations',
  maintenance: 'Maintenance',
  'health-physics': 'Health Physics',
  administrative: 'Administrative',
  training: 'Training & Licensing',
};

function topSkillsForCategory(cat: string, n = 5): Ranked[] {
  const catJobs = jobs.filter((j) => j.category === cat);
  return aggregateFacets(catJobs).skills.slice(0, n);
}

const pctOfSkilled = (count: number) => Math.round((count / jobsWithSkills.length) * 100);

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Most In-Demand Nuclear Skills & Certifications 2026 | Nuclear Hustle',
  description:
    `Which certifications and skills nuclear employers ask for most — SRO/RO licenses, PE, ` +
    `NRC regulations, ASME/ANSI standards, radiation protection — ranked from ${jobsWithSkills.length} real job listings.`,
  alternates: { canonical: '/nuclear-skills' },
};

// ── Ranked bar list ─────────────────────────────────────────────────────────

function RankedList({
  items,
  showShare = false,
  numbered = false,
}: {
  items: Ranked[];
  showShare?: boolean;
  numbered?: boolean;
}) {
  const max = items[0]?.count ?? 1;
  return (
    <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
      {items.map(({ name, count }, i) => (
        <div key={name} className="flex items-center gap-4 px-4 py-3 hover:bg-[#E5DFD5] transition-colors">
          {numbered && <span className="font-mono text-[10px] text-stone-300 w-5 shrink-0">{i + 1}</span>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-semibold text-stone-900">{name}</span>
              <span className="font-mono text-[10px] text-stone-500 shrink-0 ml-3">
                {count} job{count !== 1 ? 's' : ''}
                {showShare ? ` · ${pctOfSkilled(count)}%` : ''}
              </span>
            </div>
            <div className="h-1.5 bg-[#CFC8BC]">
              <div className="h-full bg-yellow-400" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SkillsReportPage() {
  const coverage = Math.round((jobsWithSkills.length / jobs.length) * 100);

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-600">//</span>
          <BrowseBreadcrumbCurrent>Skills report</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Nuclear skills report</BrowseLabel>
        <BrowseTitle>What skills and certifications do nuclear employers ask for?</BrowseTitle>

        <BrowseDescription>
          We analysed {jobsWithSkills.length} real nuclear job postings to see which certifications, security clearances, and skills employers list most.
        </BrowseDescription>
      </BrowsePageHeader>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#CFC8BC] border border-[#CFC8BC] mb-12">
          <div className="bg-[#EDE8DF] p-6">
            <p className="font-mono text-3xl font-bold text-stone-900">{jobs.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">Listings total</p>
          </div>
          <div className="bg-[#EDE8DF] p-6">
            <p className="font-mono text-3xl font-bold text-stone-900">{coverage}%</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">With skills data</p>
          </div>
          <div className="bg-[#EDE8DF] p-6">
            <p className="font-mono text-3xl font-bold text-stone-900">{certifications.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">Certifications tracked</p>
          </div>
          <div className="bg-[#EDE8DF] p-6">
            <p className="font-mono text-3xl font-bold text-stone-900">{skills.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">Unique skills</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">

            {/* Certifications */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">Credentials</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-3">Most-requested training &amp; certifications</h2>
              <p className="font-mono text-xs text-stone-700 leading-relaxed mb-6">
                {topCert && (
                  <>
                    {topCert.name} leads — required or preferred in {topCert.count} of {jobsWithSkills.length} skilled listings ({pctOfSkilled(topCert.count)}%).{' '}
                  </>
                )}
                Operating licenses (SRO, RO, NRC) dominate, alongside professional engineering (PE) and project management (PMP) credentials. An active SRO or RO license keeps you competitive across the widest range of plant roles.
              </p>
              <RankedList items={certifications} showShare />
            </section>

            {/* Clearances */}
            {clearances.length > 0 && (
              <section>
                <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">Access</p>
                <h2 className="font-mono text-xl font-bold text-stone-900 mb-3">Security clearance &amp; site access</h2>
                <p className="font-mono text-xs text-stone-700 leading-relaxed mb-6">
                  Most plant roles require unescorted site access — granted after a background check and fitness-for-duty screening. A handful of roles also call for DOE clearances.
                </p>
                <RankedList items={clearances} showShare />
              </section>
            )}

            {/* Skills */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">Most in demand</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-3">Top 20 skills across all listings</h2>
              <p className="font-mono text-xs text-stone-700 leading-relaxed mb-6">
                Beyond credentials, employers consistently expect regulatory fluency (NRC regulations, 10 CFR, ASME and ANSI standards), reactor-type knowledge (PWR, BWR, AP1000), and radiation protection awareness.
              </p>
              <RankedList items={topSkills} showShare numbered />
              <p className="font-mono text-[10px] text-stone-400 mt-2">
                % shown as share of {jobsWithSkills.length} listings with skills data. Skills extracted from job descriptions using AI and normalized to a shared vocabulary.
              </p>
            </section>

            {/* By job category */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">By role</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">Top skills per job category</h2>

              <div className="space-y-8">
                {Object.entries(CATEGORIES).map(([slug, label]) => {
                  const catSkills = topSkillsForCategory(slug, 5);
                  const catJobs = jobs.filter((j) => j.category === slug);
                  const catWithSkills = catJobs.filter((j) => (j.structured_description?.skills?.length ?? 0) > 0);
                  if (catSkills.length === 0) return null;
                  return (
                    <div key={slug}>
                      <div className="flex items-baseline gap-3 mb-3">
                        <Link
                          href={`/jobs/role/${slug}`}
                          className="font-mono text-xs font-bold text-stone-900 hover:text-yellow-600 transition-colors"
                        >
                          {label} →
                        </Link>
                        <span className="font-mono text-[10px] text-stone-400">
                          {catWithSkills.length} of {catJobs.length} listings
                        </span>
                      </div>
                      <RankedList items={catSkills} />
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              <div className="border border-yellow-300 bg-yellow-50 p-5">
                <p className="font-mono text-[10px] tracking-widest uppercase text-yellow-700 mb-2">Browse open roles</p>
                <p className="font-mono text-xs text-stone-600 leading-relaxed mb-4">
                  Find nuclear jobs that match your skills and certifications.
                </p>
                <Link
                  href="/jobs"
                  className="block text-center font-mono text-xs tracking-widest uppercase px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
                >
                  Browse all jobs →
                </Link>
              </div>

              <div className="border border-[#CFC8BC] p-5 space-y-3">
                <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Browse by role</p>
                {Object.entries(CATEGORIES).map(([slug, label]) => (
                  <Link
                    key={slug}
                    href={`/jobs/role/${slug}`}
                    className="block font-mono text-xs text-stone-500 hover:text-stone-900 transition-colors border-b border-[#CFC8BC] pb-3 last:border-b-0 last:pb-0"
                  >
                    {label} →
                  </Link>
                ))}
              </div>

              <div className="border border-[#CFC8BC] p-5">
                <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">Also see</p>
                <Link
                  href="/nuclear-salary"
                  className="block font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Nuclear salary guide →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
