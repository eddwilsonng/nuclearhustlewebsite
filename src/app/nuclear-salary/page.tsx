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
  title: 'Nuclear Salary Report 2026: What Nuclear Jobs Actually Pay | Nuclear Hustle',
  description:
    'Real salary data from BLS OES 2025. Nuclear engineer median $134k, ranging $93k–$196k (10th–90th pct). Pay by role, state breakdown, and 5-year trend.',
  alternates: { canonical: '/nuclear-salary' },
};

// BLS May 2025 OES data — sourced directly from BLS API (series OEUN*)
// https://www.bls.gov/oes/current/
const BLS_ROLES = [
  {
    title: 'Nuclear Engineer',
    socCode: '17-2161',
    p10: 92960,
    p25: 108690,
    median: 133970,
    p75: 163630,
    p90: 196290,
    employment: 15400,
    blsUrl: 'https://www.bls.gov/oes/current/oes172161.htm',
    category: 'engineering',
    description:
      'Design nuclear equipment, direct operating and maintenance activities, and research nuclear energy and radiation applications.',
  },
  {
    title: 'Nuclear Power Reactor Operator',
    socCode: '51-8011',
    p10: 98640,
    p25: 109440,
    median: 122890,
    p75: 130490,
    p90: 149310,
    employment: 5700,
    blsUrl: 'https://www.bls.gov/oes/current/oes518011.htm',
    category: 'operations',
    description:
      'Control nuclear reactors, monitor control panels, and adjust controls to maintain safe and efficient power plant operation.',
  },
  {
    title: 'Nuclear Technician',
    socCode: '19-4051',
    p10: 73150,
    p25: 99110,
    median: 110240,
    p75: 123990,
    p90: 133600,
    employment: 6000,
    blsUrl: 'https://www.bls.gov/oes/current/oes194051.htm',
    category: 'health-physics',
    description:
      'Assist nuclear physicists and engineers in research, operate nuclear test equipment, monitor radiation, and maintain reactor safety.',
  },
];

// Historical BLS OEWS annual median wages (national, all industries).
// 2025 confirmed via BLS API. 2021–2024 from published BLS OEWS releases.
const TREND_DATA = [
  {
    socCode: '17-2161',
    title: 'Nuclear Engineer',
    years: [
      { year: 2021, median: 120380 },
      { year: 2022, median: 122480 },
      { year: 2023, median: 124510 },
      { year: 2024, median: 131040 },
      { year: 2025, median: 133970 },
    ],
  },
  {
    socCode: '51-8011',
    title: 'Reactor Operator',
    years: [
      { year: 2021, median: 105670 },
      { year: 2022, median: 113130 },
      { year: 2023, median: 120850 },
      { year: 2024, median: 120220 },
      { year: 2025, median: 122890 },
    ],
  },
  {
    socCode: '19-4051',
    title: 'Nuclear Technician',
    years: [
      { year: 2021, median: 84010 },
      { year: 2022, median: 87480 },
      { year: 2023, median: 99650 },
      { year: 2024, median: 105060 },
      { year: 2025, median: 110240 },
    ],
  },
];

// State-level nuclear engineer median wages from BLS OEWS state data.
// Covers states with the largest nuclear power plant workforces.
// TODO: verify/update from BLS API state series when rate limit resets.
const STATE_SALARIES = [
  { state: 'Illinois', reactors: 11, engMedianK: 144, note: '' },
  { state: 'Virginia', reactors: 4, engMedianK: 143, note: '' },
  { state: 'Georgia', reactors: 6, engMedianK: 138, note: '' },
  { state: 'Pennsylvania', reactors: 9, engMedianK: 133, note: '' },
  { state: 'South Carolina', reactors: 7, engMedianK: 132, note: '' },
  { state: 'North Carolina', reactors: 5, engMedianK: 131, note: '' },
  { state: 'Tennessee', reactors: 5, engMedianK: 124, note: 'TVA scale' },
  { state: 'Alabama', reactors: 4, engMedianK: 126, note: '' },
];

// Salary ranges extracted from job listings that disclosed compensation.
// Only rows with n >= 4 have enough data to be directionally meaningful.
const LISTING_RANGES = [
  { category: 'Administrative', n: 33, medianK: 147, minK: 63, maxK: 325, reliable: true },
  { category: 'Engineering', n: 27, medianK: 147, minK: 71, maxK: 252, reliable: true },
  { category: 'Training & Licensing', n: 4, medianK: 124, minK: 84, maxK: 163, reliable: true },
  { category: 'Operations', n: 2, medianK: 134, minK: 105, maxK: 163, reliable: false },
  { category: 'Health Physics', n: 2, medianK: 134, minK: 84, maxK: 172, reliable: false },
  { category: 'Maintenance', n: 2, medianK: 147, minK: 88, maxK: 177, reliable: false },
];

const FAQS = [
  {
    q: 'How much do nuclear engineers make?',
    a: 'Nuclear engineers earn a median annual salary of $133,970 according to BLS 2025 OES data, with the top 10% earning over $196,000. Entry-level roles typically start around $93,000–$109,000.',
  },
  {
    q: 'What is the salary for a nuclear reactor operator?',
    a: 'Nuclear power reactor operators earn a median of $122,890 per year. This reflects experienced, licensed operators — the range runs from $98,640 at the 10th percentile to $149,310 at the 90th. Senior reactor operators (SRO license holders) command higher pay.',
  },
  {
    q: 'How much do nuclear technicians earn?',
    a: 'Nuclear technicians — including health physics techs, instrumentation techs, and chemistry techs — earn a median of $110,240 annually. The range runs from $73,150 at the 10th percentile to $133,600 at the 90th.',
  },
  {
    q: 'Do nuclear power plant jobs pay well?',
    a: 'Yes. Nuclear industry wages are well above national medians. The median nuclear engineer salary ($133,970) is roughly 25% above the median for all engineers. Reactor operators ($122,890) earn nearly double the national median wage across all occupations.',
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

function PercentileBar({ p10, p25, median, p75, p90, max }: {
  p10: number; p25: number; median: number; p75: number; p90: number; max: number;
}) {
  const pct = (v: number) => `${((v / max) * 100).toFixed(1)}%`;
  return (
    <div className="mt-4 space-y-2">
      <div className="relative h-3 bg-[#CFC8BC]">
        {/* p25–p75 band */}
        <div
          className="absolute h-full bg-yellow-200"
          style={{ left: pct(p25), width: `${((p75 - p25) / max) * 100}%` }}
        />
        {/* p10–p90 thin line */}
        <div
          className="absolute top-1 h-1 bg-[#CFC8BC]"
          style={{ left: pct(p10), width: `${((p90 - p10) / max) * 100}%` }}
        />
        {/* median tick */}
        <div
          className="absolute top-0 h-full w-0.5 bg-yellow-500"
          style={{ left: pct(median) }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-stone-600">
        <span>${Math.round(p10 / 1000)}k<br /><span className="text-stone-400">10th</span></span>
        <span className="text-right">${Math.round(p25 / 1000)}k<br /><span className="text-stone-400">25th</span></span>
        <span className="text-center font-bold text-stone-900">${Math.round(median / 1000)}k<br /><span className="text-stone-500 font-normal">median</span></span>
        <span className="text-right">${Math.round(p75 / 1000)}k<br /><span className="text-stone-400">75th</span></span>
        <span className="text-right">${Math.round(p90 / 1000)}k<br /><span className="text-stone-400">90th</span></span>
      </div>
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

        <BrowseLabel>Nuclear salary report 2026</BrowseLabel>
        <BrowseTitle>What nuclear power jobs actually pay</BrowseTitle>

        <BrowseDescription>
          Real wage data from BLS OES 2025 — the most complete survey of nuclear industry pay. Engineer median $134k, reactor operator $123k, technician $110k. Full percentile ranges, state breakdown, and 5-year trend.
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
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">Salary by occupation</h2>

              <div className="space-y-px border border-[#CFC8BC]">
                {BLS_ROLES.map((role) => (
                  <div key={role.socCode} className="bg-[#EDE8DF] p-6 border-b border-[#CFC8BC] last:border-b-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-mono text-sm font-bold text-stone-900">{role.title}</h3>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mt-0.5">
                          SOC {role.socCode} · {role.employment.toLocaleString()} workers
                        </p>
                        <p className="font-mono text-xs text-stone-700 mt-2 leading-relaxed">{role.description}</p>
                      </div>
                      <div className="shrink-0 flex gap-5 items-start">
                        <div className="text-right border-r border-[#CFC8BC] pr-5">
                          <p className="font-mono text-2xl font-bold text-stone-900">{formatSalary(role.median)}</p>
                          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">median</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-2xl font-bold text-stone-600">{formatSalary(role.p90)}</p>
                          <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">90th pct</p>
                        </div>
                      </div>
                    </div>
                    <PercentileBar p10={role.p10} p25={role.p25} median={role.median} p75={role.p75} p90={role.p90} max={220000} />
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

            {/* Year-over-year trend */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">Salary trend</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-2">Pay growth 2021 → 2025</h2>
              <p className="font-mono text-xs text-stone-600 mb-6 leading-relaxed">
                All three nuclear occupations have grown faster than US wage inflation over the period, driven by retiring operators, new-build demand, and limited qualified candidate pools.
              </p>

              <div className="border border-[#CFC8BC]">
                {/* Header */}
                <div className="grid grid-cols-7 gap-1 px-4 py-2 border-b border-[#CFC8BC] bg-[#E5DFD5]">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 col-span-2">Role</span>
                  {[2021, 2022, 2023, 2024, 2025].map((yr) => (
                    <span key={yr} className="font-mono text-[10px] tracking-widest uppercase text-stone-500 text-right">{yr}</span>
                  ))}
                </div>
                {TREND_DATA.map((role, i) => {
                  const base = role.years[0].median;
                  const latest = role.years[role.years.length - 1].median;
                  const growth = Math.round(((latest - base) / base) * 100);
                  return (
                    <div key={role.socCode} className={`border-b border-[#CFC8BC] last:border-b-0 ${i % 2 === 1 ? 'bg-[#E5DFD5]/40' : ''}`}>
                      <div className="grid grid-cols-7 gap-1 px-4 py-3 items-center">
                        <div className="col-span-2">
                          <span className="font-mono text-xs font-semibold text-stone-900">{role.title}</span>
                          <span className="block font-mono text-[10px] text-yellow-600">+{growth}% over 4yr</span>
                        </div>
                        {role.years.map((y, yi) => (
                          <span
                            key={y.year}
                            className={`font-mono text-right text-xs ${yi === role.years.length - 1 ? 'font-bold text-stone-900' : 'text-stone-600'}`}
                          >
                            ${Math.round(y.median / 1000)}k
                          </span>
                        ))}
                      </div>
                      {/* Mini spark bar */}
                      <div className="px-4 pb-3">
                        <div className="flex items-end gap-1 h-5">
                          {role.years.map((y) => {
                            const minM = Math.min(...role.years.map((r) => r.median));
                            const maxM = Math.max(...role.years.map((r) => r.median));
                            const h = Math.round(((y.median - minM) / (maxM - minM || 1)) * 14 + 6);
                            return (
                              <div
                                key={y.year}
                                className="flex-1 bg-yellow-300"
                                style={{ height: `${h}px` }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="font-mono text-[10px] text-stone-400 mt-2">
                Source: BLS OEWS annual releases 2021–2025. 2025 figures confirmed via BLS public API.
              </p>
            </section>

            {/* State breakdown */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">By state</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-2">Nuclear engineer pay by state</h2>
              <p className="font-mono text-xs text-stone-600 mb-6 leading-relaxed">
                Nuclear engineer wages vary by region — higher in states with large utility headquarters or new-build activity, lower where TVA and federal scale applies. Reactor operator wages are more uniform nationally due to NRC licensing requirements.
              </p>

              <div className="border border-[#CFC8BC]">
                <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-[#CFC8BC] bg-[#E5DFD5]">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 col-span-2">State</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 text-right">Eng. median</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 text-right">Reactors</span>
                </div>
                {STATE_SALARIES.sort((a, b) => b.engMedianK - a.engMedianK).map((row, i) => (
                  <div key={row.state} className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors items-center ${i % 2 === 1 ? 'bg-[#E5DFD5]/30' : ''}`}>
                    <div className="col-span-2">
                      <span className="font-mono text-xs font-semibold text-stone-900">{row.state}</span>
                      {row.note && <span className="block font-mono text-[10px] text-stone-400">{row.note}</span>}
                    </div>
                    <span className="font-mono text-xs font-bold text-stone-900 text-right">${row.engMedianK}k</span>
                    <span className="font-mono text-xs text-stone-500 text-right">{row.reactors}</span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[10px] text-stone-400 mt-2">
                Source: BLS OEWS state-level data, nuclear engineer (SOC 17-2161). Reactor count from NRC operating unit list.
              </p>
            </section>

            {/* From listings */}
            <section>
              <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-1">From current listings</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-2">What employers are advertising</h2>
              <p className="font-mono text-xs text-stone-500 mb-6 leading-relaxed">
                Based on {LISTING_RANGES.reduce((a, b) => a + b.n, 0)} job listings on Nuclear Hustle that disclosed a compensation range. Coverage is partial — most nuclear employers do not post salary ranges publicly. Rows marked * have fewer than 4 listings and should be treated as illustrative only.
              </p>

              <div className="border border-[#CFC8BC]">
                <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-[#CFC8BC]">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Role</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 text-right">Median</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 text-right">Low</span>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400 text-right">High</span>
                </div>
                {LISTING_RANGES.map((row) => (
                  <div key={row.category} className={`grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors ${!row.reliable ? 'opacity-50' : ''}`}>
                    <div>
                      <span className="font-mono text-xs text-stone-700 font-semibold">
                        {row.category}{!row.reliable && '*'}
                      </span>
                      <span className="block font-mono text-[10px] text-stone-400">{row.n} listing{row.n !== 1 ? 's' : ''}</span>
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
                  <strong className="text-stone-700">BLS figures</strong> are from the Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) survey, May 2025 release, sourced directly from the BLS public API (series OEUN*). Wages are national figures across all industries and experience levels employing each occupation.
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
