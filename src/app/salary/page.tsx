import { Metadata } from 'next';
import Link from 'next/link';
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
  title: 'Nuclear Industry Salary Guide 2024 | Nuclear Hustle',
  description:
    'Nuclear industry salary data for reactor operators, engineers, and technicians. Median wages, pay ranges, and hiring trends based on BLS 2024 OES data.',
  alternates: { canonical: '/salary' },
};

// BLS May 2024 OES data — source: Bureau of Labor Statistics
// https://www.bls.gov/oes/current/
const BLS_ROLES = [
  {
    title: 'Nuclear Engineer',
    socCode: '17-2161',
    median: 127520,
    hourlyMedian: 61.31,
    employment: 15400,
    blsUrl: 'https://www.bls.gov/oes/current/oes172161.htm',
    category: 'engineering',
    description:
      'Design nuclear equipment, direct operating and maintenance activities, and research nuclear energy and radiation applications.',
  },
  {
    title: 'Nuclear Power Reactor Operator',
    socCode: '51-8011',
    median: 122610,
    hourlyMedian: 58.95,
    employment: 5700,
    blsUrl: 'https://www.bls.gov/oes/current/oes518011.htm',
    category: 'operations',
    description:
      'Control nuclear reactors, monitor control panels, and adjust controls to maintain safe and efficient power plant operation.',
  },
  {
    title: 'Nuclear Technician',
    socCode: '19-4051',
    median: 104240,
    hourlyMedian: 50.11,
    employment: 6000,
    blsUrl: 'https://www.bls.gov/oes/current/oes194051.htm',
    category: 'health-physics',
    description:
      'Assist nuclear physicists and engineers in research, operate nuclear test equipment, monitor radiation, and maintain reactor safety.',
  },
];

// Salary ranges extracted from job listings that disclosed compensation
const LISTING_RANGES = [
  { category: 'Engineering', n: 27, medianK: 147, minK: 71, maxK: 252 },
  { category: 'Operations', n: 3, medianK: 133, minK: 92, maxK: 163 },
  { category: 'Training & Licensing', n: 4, medianK: 124, minK: 84, maxK: 163 },
  { category: 'Health Physics', n: 2, medianK: 134, minK: 84, maxK: 172 },
  { category: 'Maintenance', n: 3, medianK: 110, minK: 64, maxK: 177 },
  { category: 'Administrative', n: 33, medianK: 147, minK: 63, maxK: 325 },
];

const FAQS = [
  {
    q: 'How much do nuclear engineers make?',
    a: 'Nuclear engineers earn a median annual salary of $127,520 according to BLS 2024 OES data, with the top 10% earning over $188,000. Entry-level roles typically start around $80,000–$99,000.',
  },
  {
    q: 'What is the salary for a nuclear reactor operator?',
    a: 'Nuclear power reactor operators earn a median of $122,610 per year ($58.95/hour). This reflects experienced, licensed operators. Senior reactor operators (SRO license holders) command higher pay.',
  },
  {
    q: 'How much do nuclear technicians earn?',
    a: 'Nuclear technicians — including health physics techs, instrumentation techs, and chemistry techs — earn a median of $104,240 annually. The range typically spans $56,000–$140,000 depending on experience and specialisation.',
  },
  {
    q: 'Do nuclear power plant jobs pay well?',
    a: 'Yes. Nuclear industry wages are well above national medians. The median nuclear engineer salary ($127,520) is roughly 20% above the median for all engineers. Reactor operators ($122,610) earn nearly double the national median wage across all occupations.',
  },
  {
    q: 'Which nuclear jobs pay the most?',
    a: 'Nuclear engineers and senior reactor operators are the highest-paid nuclear plant roles. Engineering roles in new-build projects (SMRs, advanced reactors) at companies like TerraPower and X-energy are also commanding premium compensation.',
  },
  {
    q: 'Do nuclear plant jobs include benefits beyond salary?',
    a: 'Yes — nuclear utilities typically offer strong defined-benefit pension plans, comprehensive health insurance, shift differentials for rotating schedules, and relocation packages for hard-to-fill roles.',
  },
  {
    q: 'Are nuclear industry salaries growing?',
    a: 'Compensation is holding steady or rising modestly. The US nuclear renaissance — driven by SMR development and licence extensions on existing plants — is creating demand for qualified operators and engineers, supporting wages.',
  },
];

function formatSalary(n: number) {
  return '$' + n.toLocaleString('en-US');
}

function SalaryBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full h-1.5 bg-[#CFC8BC] mt-2">
      <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function SalaryPage() {
  const highestMedian = Math.max(...BLS_ROLES.map((r) => r.median));

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-600">//</span>
          <BrowseBreadcrumbCurrent>Salary guide</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Resources</BrowseLabel>
        <BrowseTitle>Nuclear industry salary guide</BrowseTitle>

        <BrowseMeta>
          Based on <strong>BLS 2024 OES data</strong>
          <span className="text-stone-500 mx-2">//</span>
          Updated annually
        </BrowseMeta>

        <BrowseDescription>
          Median wages, pay ranges, and hiring data for nuclear power plant roles — reactor operators, engineers, and technicians. Source: Bureau of Labor Statistics Occupational Employment and Wage Statistics, May 2024.
        </BrowseDescription>
      </BrowsePageHeader>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#CFC8BC] border border-[#CFC8BC] mb-12">
          {BLS_ROLES.map((role) => (
            <div key={role.socCode} className="bg-[#EDE8DF] p-6">
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">
                {role.title}
              </p>
              <p className="font-mono text-3xl font-bold text-stone-900">
                ${Math.round(role.median / 1000)}k
              </p>
              <p className="font-mono text-xs text-stone-400 mt-1">median annual</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">

            {/* BLS role cards */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">By occupation</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">Nuclear-specific BLS occupations</h2>

              <div className="space-y-px border border-[#CFC8BC]">
                {BLS_ROLES.map((role) => (
                  <div key={role.socCode} className="bg-[#EDE8DF] p-6 border-b border-[#CFC8BC] last:border-b-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono text-sm font-bold text-stone-900">{role.title}</h3>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-0.5">
                          SOC {role.socCode} · {role.employment.toLocaleString()} workers
                        </p>
                        <p className="font-mono text-xs text-stone-500 mt-2 leading-relaxed">{role.description}</p>
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <p className="font-mono text-2xl font-bold text-stone-900">{formatSalary(role.median)}</p>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">median / year</p>
                        <p className="font-mono text-xs text-stone-500 mt-0.5">${role.hourlyMedian}/hr</p>
                      </div>
                    </div>
                    <SalaryBar value={role.median} max={highestMedian * 1.1} />
                    <div className="mt-3 flex items-center justify-between">
                      <Link
                        href={`/jobs/role/${role.category}`}
                        className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors"
                      >
                        Browse {role.title.toLowerCase()} jobs →
                      </Link>
                      <a
                        href={role.blsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        BLS source ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* From listings */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">From current listings</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-2">What employers are advertising</h2>
              <p className="font-mono text-xs text-stone-500 mb-6 leading-relaxed">
                Based on {LISTING_RANGES.reduce((a, b) => a + b.n, 0)} job listings on Nuclear Hustle that disclosed a compensation range. Coverage is partial — most nuclear employers do not post salary ranges publicly.
              </p>

              <div className="border border-[#CFC8BC]">
                <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-[#CFC8BC]">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Role</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 text-right">Median</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 text-right">Low</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 text-right">High</span>
                </div>
                {LISTING_RANGES.map((row) => (
                  <div key={row.category} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors">
                    <div>
                      <span className="font-mono text-xs text-stone-700 font-semibold">{row.category}</span>
                      <span className="block font-mono text-[10px] text-stone-400">{row.n} listings</span>
                    </div>
                    <span className="font-mono text-xs text-stone-900 font-bold text-right self-center">${row.medianK}k</span>
                    <span className="font-mono text-xs text-stone-500 text-right self-center">${row.minK}k</span>
                    <span className="font-mono text-xs text-stone-500 text-right self-center">${row.maxK}k</span>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">Common questions</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">Nuclear salary FAQs</h2>

              <div className="space-y-px border border-[#CFC8BC]">
                {FAQS.map((faq, i) => (
                  <div key={i} className="bg-[#EDE8DF] p-5 border-b border-[#CFC8BC] last:border-b-0">
                    <h3 className="font-mono text-xs font-bold text-stone-900 mb-2">{faq.q}</h3>
                    <p className="font-mono text-xs text-stone-500 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Methodology */}
            <section className="border border-[#CFC8BC] p-6 bg-[#E5DFD5]">
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-3">Methodology</p>
              <div className="space-y-2 font-mono text-xs text-stone-500 leading-relaxed">
                <p>
                  <strong className="text-stone-700">BLS figures</strong> are from the Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) survey, May 2024 release. Wages are national medians across all industries and experience levels employing each occupation.
                </p>
                <p>
                  <strong className="text-stone-700">Listing ranges</strong> are extracted from job descriptions on Nuclear Hustle that explicitly stated a compensation or salary range. Only labeled ranges (e.g. &quot;Compensation Range: $X – $Y&quot;) are included. Hourly rates are annualised at 2,080 hours.
                </p>
                <p>
                  Coverage is non-random: companies that post ranges tend to be larger utilities and new-build firms. Treat listing figures as directional, not representative of industry-wide pay.
                </p>
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              <div className="border border-yellow-300 bg-yellow-50 p-5">
                <p className="font-mono text-[10px] tracking-widest uppercase text-yellow-700 mb-2">Browse open roles</p>
                <p className="font-mono text-xs text-stone-600 leading-relaxed mb-4">
                  View current nuclear job listings filtered by role, state, and employer.
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
                {[
                  { label: 'Engineering', href: '/jobs/role/engineering' },
                  { label: 'Operations', href: '/jobs/role/operations' },
                  { label: 'Maintenance', href: '/jobs/role/maintenance' },
                  { label: 'Health Physics', href: '/jobs/role/health-physics' },
                  { label: 'Training & Licensing', href: '/jobs/role/training' },
                  { label: 'Administrative', href: '/jobs/role/administrative' },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="block font-mono text-xs text-stone-500 hover:text-stone-900 transition-colors border-b border-[#CFC8BC] pb-3 last:border-b-0 last:pb-0"
                  >
                    {label} →
                  </Link>
                ))}
              </div>

              <div className="border border-[#CFC8BC] p-5">
                <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">Data source</p>
                <p className="font-mono text-xs text-stone-500 leading-relaxed mb-3">
                  BLS figures are from the May 2024 Occupational Employment and Wage Statistics survey.
                </p>
                <a
                  href="https://www.bls.gov/oes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                >
                  bls.gov/oes ↗
                </a>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
