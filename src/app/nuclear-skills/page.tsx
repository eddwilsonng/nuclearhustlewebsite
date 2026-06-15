import { Metadata } from 'next';
import Link from 'next/link';
import jobsData from '@/data/jobs.json';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
  BrowseDescription,
} from '@/components/BrowsePageHeader';

export const metadata: Metadata = {
  title: 'Most In-Demand Nuclear Industry Skills 2026 | Nuclear Hustle',
  description:
    'See which skills nuclear employers ask for most. SRO License, PWR/BWR, ASME NQA-1, radiation protection, and more — ranked by 434 real job listings.',
  alternates: { canonical: '/nuclear-skills' },
};

// ── Data computation (runs at build time) ────────────────────────────────────

type Job = {
  category?: string;
  structured_description?: { skills?: string[] };
};

const jobs: Job[] = (jobsData as { jobs: Job[] }).jobs;

function normalizeSkills(jobs: Job[]) {
  const variants: Record<string, Record<string, number>> = {};
  jobs.forEach((j) => {
    (j.structured_description?.skills ?? []).forEach((s) => {
      const key = s.toLowerCase().trim();
      if (!variants[key]) variants[key] = {};
      variants[key][s] = (variants[key][s] ?? 0) + 1;
    });
  });
  return Object.entries(variants)
    .map(([, v]) => {
      const total = Object.values(v).reduce((a, b) => a + b, 0);
      const canonical = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
      return { skill: canonical, count: total };
    })
    .sort((a, b) => b.count - a.count);
}

const jobsWithSkills = jobs.filter((j) => (j.structured_description?.skills?.length ?? 0) > 0);
const allSkills = normalizeSkills(jobs);
const topSkills = allSkills.slice(0, 20);
const maxCount = topSkills[0].count;

const CATEGORIES: Record<string, string> = {
  engineering: 'Engineering',
  operations: 'Operations',
  maintenance: 'Maintenance',
  'health-physics': 'Health Physics',
  administrative: 'Administrative',
  training: 'Training & Licensing',
};

function topSkillsForCategory(cat: string, n = 6) {
  const catJobs = jobs.filter((j) => j.category === cat);
  return normalizeSkills(catJobs).slice(0, n);
}

const SKILL_GROUPS = [
  {
    label: 'Licenses & Certifications',
    desc: 'Formal credentials required or preferred — NRC, PE, and project management.',
    skills: ['SRO License', 'RO License', 'NRC License', 'PE License', 'PE Registration', 'EIT Certification', 'PMP'],
  },
  {
    label: 'Reactor Technology',
    desc: 'Plant type knowledge and operations experience.',
    skills: ['PWR', 'BWR', 'Nuclear Power Plant Operations', 'Nuclear Engineering', 'Reactor Operations', 'NUCLEAR OPERATIONS'],
  },
  {
    label: 'Standards & Regulatory',
    desc: 'Codes, standards, and regulatory frameworks cited in job requirements.',
    skills: ['ANSI/ANS-3.1-2014', 'ASME NQA-1', 'NQA-1', 'NRC REGULATIONS', 'ASME Section III', 'INPO', 'SAT', 'ALARA'],
  },
  {
    label: 'Safety & Access',
    desc: 'Radiation protection, site access, and clearance requirements.',
    skills: ['RADIATION PROTECTION', 'HEALTH PHYSICS', 'Security Clearance', 'Unescorted Access', 'DOE', 'POSS'],
  },
  {
    label: 'Software & Analysis',
    desc: 'Specialist tools and simulation codes that appear in nuclear job postings.',
    skills: ['MCNP', 'ETAP', 'PLC', 'CAD', 'PRA', 'SCALE'],
  },
];

// Enrich groups with live counts
const skillCountMap = Object.fromEntries(
  allSkills.map(({ skill, count }) => [skill.toLowerCase(), count])
);

function getCount(skill: string) {
  return skillCountMap[skill.toLowerCase()] ?? 0;
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
        <BrowseTitle>What skills do nuclear employers actually ask for?</BrowseTitle>

        <BrowseDescription>
          We analysed {jobsWithSkills.length} real nuclear job postings to find out which certifications, reactor knowledge, and tools employers actually list.
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
            <p className="font-mono text-3xl font-bold text-stone-900">{jobsWithSkills.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">With skills data</p>
          </div>
          <div className="bg-[#EDE8DF] p-6">
            <p className="font-mono text-3xl font-bold text-stone-900">{coverage}%</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">Coverage rate</p>
          </div>
          <div className="bg-[#EDE8DF] p-6">
            <p className="font-mono text-3xl font-bold text-stone-900">{allSkills.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-1">Unique skills</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">

            {/* Top 20 chart */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">Most in demand</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-3">Top 20 skills across all listings</h2>
              <p className="font-mono text-xs text-stone-700 leading-relaxed mb-6">
                SRO License appears in nearly 1 in 4 postings — more than three times the next-ranked skill. Beyond licensing, employers consistently expect reactor type knowledge (PWR or BWR), radiation protection awareness, and familiarity with NRC regulations and ASME/ANSI standards. If you hold an active SRO or RO license, you are competitive across the widest range of roles.
              </p>

              <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
                {topSkills.map(({ skill, count }, i) => {
                  const pct = (count / maxCount) * 100;
                  const jobPct = Math.round((count / jobsWithSkills.length) * 100);
                  return (
                    <div key={skill} className="flex items-center gap-4 px-4 py-3 hover:bg-[#E5DFD5] transition-colors">
                      <span className="font-mono text-[10px] text-stone-300 w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-semibold text-stone-900">{skill}</span>
                          <span className="font-mono text-[10px] text-stone-500 shrink-0 ml-3">{count} jobs · {jobPct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#CFC8BC]">
                          <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="font-mono text-[10px] text-stone-400 mt-2">
                % shown as share of {jobsWithSkills.length} listings with skills data. Skills extracted from job descriptions using AI.
              </p>
            </section>

            {/* Skill groups */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">By skill type</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">Skills by category</h2>

              <div className="space-y-8">
                {SKILL_GROUPS.map((group) => {
                  const ranked = group.skills
                    .map((s) => ({ skill: s, count: getCount(s) }))
                    .filter((s) => s.count > 0)
                    .sort((a, b) => b.count - a.count);
                  const groupMax = ranked[0]?.count ?? 1;
                  return (
                    <div key={group.label}>
                      <div className="flex items-baseline gap-3 mb-3">
                        <p className="font-mono text-xs font-bold text-stone-900">{group.label}</p>
                        <p className="font-mono text-[10px] text-stone-400">{group.desc}</p>
                      </div>
                      <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
                        {ranked.map(({ skill, count }) => (
                          <div key={skill} className="flex items-center gap-4 px-4 py-3 hover:bg-[#E5DFD5] transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-xs font-semibold text-stone-900">{skill}</span>
                                <span className="font-mono text-[10px] text-stone-500 shrink-0 ml-3">{count} jobs</span>
                              </div>
                              <div className="h-1.5 bg-[#CFC8BC]">
                                <div className="h-full bg-yellow-400" style={{ width: `${(count / groupMax) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  const catMax = catSkills[0]?.count ?? 1;
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
                      <div className="border border-[#CFC8BC] divide-y divide-[#CFC8BC]">
                        {catSkills.map(({ skill, count }) => (
                          <div key={skill} className="flex items-center gap-4 px-4 py-3 hover:bg-[#E5DFD5] transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-mono text-xs font-semibold text-stone-900">{skill}</span>
                                <span className="font-mono text-[10px] text-stone-500 shrink-0 ml-3">{count} jobs</span>
                              </div>
                              <div className="h-1.5 bg-[#CFC8BC]">
                                <div className="h-full bg-yellow-400" style={{ width: `${(count / catMax) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
