import { Metadata } from 'next';
import Link from 'next/link';
import {
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseDescription,
} from '@/components/BrowsePageHeader';
import { JobAlertForm } from '@/components/JobAlertForm';
import { SectionIndex } from '@/components/SectionIndex';
import { LinkButton } from '@/components/ui/LinkButton';
import { cn } from '@/lib/cn';
import { getActiveCategories, getActiveStates, getJobs } from '@/lib/data/static';
import { getListingSalarySnapshot } from '@/lib/salaryGuide';
import { generateFaqSchema } from '@/lib/seo/schema';
import { US_STATES } from '@/lib/states';

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
    shortTitle: 'Nuclear engineer',
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
    shortTitle: 'Reactor operator',
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
    shortTitle: 'Nuclear technician',
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

const FAQS = [
  {
    question: 'How much do nuclear engineers make?',
    answer: 'Nuclear engineers earn a median annual salary of $133,970 with the top 10% earning over $196,000. Entry-level roles typically start around $93,000–$109,000.',
  },
  {
    question: 'What is the salary for a nuclear reactor operator?',
    answer: 'Nuclear power reactor operators earn a median of $122,890 per year. This reflects experienced, licensed operators — the range runs from $98,640 at the 10th percentile to $149,310 at the 90th. Senior reactor operators (SRO license holders) command higher pay.',
  },
  {
    question: 'How much do nuclear technicians earn?',
    answer: 'Nuclear technicians — including health physics techs, instrumentation techs, and chemistry techs — earn a median of $110,240 annually. The range runs from $73,150 at the 10th percentile to $133,600 at the 90th.',
  },
  {
    question: 'Do nuclear power plant jobs pay well?',
    answer: 'Yes. Nuclear industry wages are well above national medians. The median nuclear engineer salary ($133,970) is roughly 25% above the median for all engineers. Reactor operators ($122,890) earn nearly double the national median wage across all occupations.',
  },
  {
    question: 'Which nuclear jobs pay the most?',
    answer: 'Nuclear engineers and senior reactor operators are the highest-paid nuclear plant roles. Engineering roles in new-build projects (SMRs, advanced reactors) at companies like TerraPower and X-energy are also commanding premium compensation.',
  },
  {
    question: 'Do nuclear plant jobs include benefits beyond salary?',
    answer: 'Yes — nuclear utilities typically offer strong defined-benefit pension plans, comprehensive health insurance, shift differentials for rotating schedules, and relocation packages for hard-to-fill roles.',
  },
  {
    question: 'Are nuclear industry salaries growing?',
    answer: 'Compensation is holding steady or rising modestly. The US nuclear renaissance — driven by SMR development and licence extensions on existing plants — is creating demand for qualified operators and engineers, supporting wages.',
  },
];

const SECTIONS = [
  { id: 'by-role', label: 'Pay by role' },
  { id: 'posted-pay', label: 'Posted pay' },
  { id: 'by-state', label: 'By state' },
  { id: 'growth', label: 'Pay growth' },
  { id: 'faq', label: 'FAQ' },
] as const;

const NATIONAL_ENG_MEDIAN_K = Math.round(BLS_ROLES[0].median / 1000);

function formatK(n: number) {
  return `$${Math.round(n / 1000)}k`;
}

function formatDiffK(k: number) {
  if (k === 0) return 'Level';
  return `${k > 0 ? '+' : '−'}$${Math.abs(k)}k`;
}

// --- Shared pay axis ----------------------------------------------------------
// Both range charts use one axis so a band in "Posted pay" lines up with the
// BLS band above it.

const AXIS_STEP = 20000;

interface Axis {
  min: number;
  max: number;
  ticks: number[];
}

function buildAxis(values: number[]): Axis {
  const min = Math.floor(Math.min(...values) / AXIS_STEP) * AXIS_STEP;
  const max = Math.ceil(Math.max(...values) / AXIS_STEP) * AXIS_STEP;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += AXIS_STEP) ticks.push(t);
  return { min, max, ticks };
}

function axisPos(axis: Axis, value: number) {
  return ((value - axis.min) / (axis.max - axis.min)) * 100;
}

function AxisLabels({ axis, className }: { axis: Axis; className?: string }) {
  const last = axis.ticks.length - 1;
  return (
    <div aria-hidden="true" className={cn('relative h-5 font-mono text-xs text-secondary', className)}>
      {axis.ticks.map((tick, i) => (
        <span
          key={tick}
          className={cn(
            'absolute top-0 tabular-nums',
            i === 0 ? 'translate-x-0' : i === last ? '-translate-x-full' : '-translate-x-1/2',
            // Narrow screens label every other tick, counted back from the last.
            (last - i) % 2 === 1 && 'hidden sm:inline',
          )}
          style={{ left: `${axisPos(axis, tick)}%` }}
        >
          {formatK(tick)}
        </span>
      ))}
    </div>
  );
}

/** Band from low to high with a median tick; optional whisker for the outer range. */
function RangeTrack({
  axis,
  low,
  high,
  mid,
  outerLow,
  outerHigh,
}: {
  axis: Axis;
  low: number;
  high: number;
  mid: number;
  outerLow?: number;
  outerHigh?: number;
}) {
  const hasWhisker = outerLow != null && outerHigh != null;
  return (
    <div aria-hidden="true" className="relative h-8">
      {axis.ticks.map((tick) => (
        <span
          key={tick}
          className="absolute inset-y-0 w-px bg-rule"
          style={{ left: `${axisPos(axis, tick)}%` }}
        />
      ))}
      {hasWhisker && (
        <>
          <span
            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-control"
            style={{
              left: `${axisPos(axis, outerLow)}%`,
              width: `${axisPos(axis, outerHigh) - axisPos(axis, outerLow)}%`,
            }}
          />
          {[outerLow, outerHigh].map((v) => (
            <span
              key={v}
              className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-control"
              style={{ left: `${axisPos(axis, v)}%` }}
            />
          ))}
        </>
      )}
      <span
        className="absolute top-1/2 h-4 min-w-0.5 -translate-y-1/2 border border-signal-border bg-signal"
        style={{
          left: `${axisPos(axis, low)}%`,
          width: `${axisPos(axis, high) - axisPos(axis, low)}%`,
        }}
      />
      <span
        className="absolute top-1 bottom-1 w-0.5 -translate-x-1/2 bg-ink"
        style={{ left: `${axisPos(axis, mid)}%` }}
      />
    </div>
  );
}

function RangeValues({ values }: { values: { label: string; value: number; key?: boolean }[] }) {
  return (
    <dl
      className={cn('mt-3 grid gap-2 font-mono text-xs', values.length > 3 ? 'max-w-xl' : 'max-w-xs')}
      style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
    >
      {values.map(({ label, value, key }) => (
        <div key={label}>
          <dt className={key ? 'text-ink' : 'text-secondary'}>{label}</dt>
          <dd className={cn('mt-0.5 text-sm tabular-nums', key ? 'font-semibold text-ink' : 'text-secondary')}>
            {formatK(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// --- Layout -------------------------------------------------------------------

function Section({
  id,
  index,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="border-b border-rule py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">
            <span className="text-ink">{String(index).padStart(2, '0')}</span> · {eyebrow}
          </p>
          <h2
            id={`${id}-heading`}
            className="mt-2 font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl text-balance"
          >
            {title}
          </h2>
          {intro && (
            <div className="mt-3 space-y-3 font-sans text-base leading-relaxed text-secondary text-pretty">
              {intro}
            </div>
          )}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

const ROW_GRID = 'lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-x-12';
const STATE_GRID = 'md:grid-cols-[2rem_11rem_minmax(0,1fr)_8rem_8.5rem]';

function ChartLegend({ whisker }: { whisker?: string }) {
  return (
    <ul
      aria-hidden="true"
      className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-secondary"
    >
      {whisker && (
        <li className="flex items-center gap-2">
          <span className="relative block h-3 w-6">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-control" />
          </span>
          {whisker}
        </li>
      )}
      <li className="flex items-center gap-2">
        <span className="block h-3 w-6 border border-signal-border bg-signal" />
        {whisker ? 'Middle 50% (25th–75th)' : 'Median posted minimum to maximum'}
      </li>
      <li className="flex items-center gap-2">
        <span className="block h-4 w-0.5 bg-ink" />
        Median
      </li>
    </ul>
  );
}

export default function SalaryPage() {
  const listings = getListingSalarySnapshot();
  const publishedCount = getJobs().length;
  const categoryCounts = new Map(getActiveCategories().map((c) => [c.category as string, c]));
  const stateJobCounts = new Map(getActiveStates().map(({ state, count }) => [state.slug, count]));

  const reliableRanges = listings.ranges.filter((row) => row.reliable);
  const smallRanges = listings.ranges.filter((row) => !row.reliable);

  const axis = buildAxis([
    ...BLS_ROLES.flatMap((role) => [role.p10, role.p90]),
    ...reliableRanges.flatMap((row) => [row.lowK * 1000, row.highK * 1000]),
  ]);

  const stateRows = [...STATE_SALARIES]
    .sort((a, b) => b.engMedianK - a.engMedianK)
    .map((row) => {
      const slug = US_STATES.find((s) => s.name === row.state)?.slug;
      return {
        ...row,
        slug,
        jobCount: slug ? stateJobCounts.get(slug) ?? 0 : 0,
        diffK: row.engMedianK - NATIONAL_ENG_MEDIAN_K,
      };
    });
  const diffScale = Math.max(5, Math.ceil((Math.max(...stateRows.map((r) => Math.abs(r.diffK))) + 1) / 5) * 5);

  const trendMax = Math.max(...TREND_DATA.flatMap((role) => role.years.map((y) => y.median)));
  const trends = TREND_DATA.map((role) => {
    const first = role.years[0];
    const last = role.years[role.years.length - 1];
    const label = BLS_ROLES.find((r) => r.socCode === role.socCode)?.shortTitle ?? role.title;
    return {
      ...role,
      label,
      first,
      last,
      growth: Math.round(((last.median - first.median) / first.median) * 100),
    };
  });
  const fastest = [...trends].sort((a, b) => b.growth - a.growth)[0];

  const faqSchema = generateFaqSchema(FAQS);

  return (
    <div className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className="bg-surface pt-12">
        <div className="mx-auto max-w-6xl px-6">
          <BrowseBreadcrumb>
            <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
            <span aria-hidden="true">/</span>
            <BrowseBreadcrumbCurrent>Salary guide</BrowseBreadcrumbCurrent>
          </BrowseBreadcrumb>

          <BrowseLabel>Nuclear salary report 2026</BrowseLabel>
          <BrowseTitle>What nuclear power jobs actually pay</BrowseTitle>
          <BrowseDescription>
            Median pay for nuclear engineers, reactor operators, and technicians, from Bureau of
            Labor Statistics data for May 2025. Below that, the pay stated in{' '}
            {listings.disclosingCount.toLocaleString('en-US')} live postings on Nuclear Hustle.
          </BrowseDescription>

          <dl className="mt-10 grid grid-cols-1 border-y border-rule sm:grid-cols-3">
            {BLS_ROLES.map((role) => (
              <div
                key={role.socCode}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-rule py-4 last:border-b-0 sm:block sm:border-b-0 sm:border-l sm:px-6 sm:py-5 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="font-sans text-sm font-semibold text-ink">{role.shortTitle}</dt>
                <dd className="col-start-2 row-span-2 row-start-1 font-sans text-3xl font-bold tracking-tight tabular-nums text-ink sm:mt-1 sm:text-4xl md:text-5xl">
                  {formatK(role.median)}
                </dd>
                <dd className="mt-1 font-mono text-xs text-secondary sm:mt-2">
                  Median · 10th–90th{' '}
                  <span className="tabular-nums text-ink">
                    {formatK(role.p10)}–{formatK(role.p90)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <SectionIndex items={SECTIONS} />

      {/* 01 — BLS by occupation */}
      <Section
        id="by-role"
        index={1}
        eyebrow="By occupation"
        title="Pay by role"
        intro={
          <p>
            National annual pay across every employer of each occupation. All three roles sit on one
            scale, so the bands compare directly.
          </p>
        }
      >
        <ChartLegend whisker="10th–90th percentile" />
        <div className={cn('mt-6 hidden', ROW_GRID)}>
          <span />
          <AxisLabels axis={axis} />
        </div>
        <ul className="border-t border-rule lg:mt-2">
          {BLS_ROLES.map((role) => {
            const jobs = categoryCounts.get(role.category);
            return (
              <li key={role.socCode} className={cn('border-b border-rule py-8', ROW_GRID)}>
                <div>
                  <h3 className="font-sans text-lg font-semibold text-ink">{role.title}</h3>
                  <p className="mt-1 font-mono text-xs text-secondary">
                    {role.employment.toLocaleString('en-US')} employed nationally
                  </p>
                  <p className="mt-3 max-w-prose font-sans text-sm leading-relaxed text-secondary">
                    {role.description}
                  </p>
                  {jobs && (
                    <Link
                      href={`/jobs/role/${role.category}`}
                      className="mt-4 inline-block font-sans text-sm font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      Browse {jobs.count.toLocaleString('en-US')} {jobs.name.toLowerCase()} roles →
                    </Link>
                  )}
                </div>
                <div className="mt-6 lg:mt-0 lg:pt-1">
                  <AxisLabels axis={axis} className="mb-1 lg:hidden" />
                  <RangeTrack
                    axis={axis}
                    low={role.p25}
                    high={role.p75}
                    mid={role.median}
                    outerLow={role.p10}
                    outerHigh={role.p90}
                  />
                  <RangeValues
                    values={[
                      { label: '10th', value: role.p10 },
                      { label: '25th', value: role.p25 },
                      { label: 'Median', value: role.median, key: true },
                      { label: '75th', value: role.p75 },
                      { label: '90th', value: role.p90 },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 02 — From current listings */}
      <Section
        id="posted-pay"
        index={2}
        eyebrow="Live postings"
        title="What employers are posting"
        intro={
          <>
            <p>
              {listings.disclosingCount.toLocaleString('en-US')} of{' '}
              {publishedCount.toLocaleString('en-US')} published postings state pay, as of{' '}
              {listings.asOfLabel}. Each bar runs
              from the median posted minimum to the median posted maximum for that role, on the
              same scale as the chart above.
            </p>
            {listings.topEmployer && (
              <p>
                {listings.topEmployer.name} posts{' '}
                {listings.topEmployer.count.toLocaleString('en-US')} of them (
                {listings.topEmployer.share}%), so read these as directional.
              </p>
            )}
          </>
        }
      >
        <ChartLegend />
        <div className={cn('mt-6 hidden', ROW_GRID)}>
          <span />
          <AxisLabels axis={axis} />
        </div>
        <ul className="border-t border-rule lg:mt-2">
          {reliableRanges.map((row) => {
            const jobs = categoryCounts.get(row.category);
            return (
              <li key={row.category} className={cn('border-b border-rule py-6 lg:items-center', ROW_GRID)}>
                <div>
                  <h3 className="font-sans text-base font-semibold text-ink">{row.label}</h3>
                  <p className="mt-1 font-mono text-xs text-secondary">
                    {row.n.toLocaleString('en-US')} posting{row.n !== 1 ? 's' : ''} with pay
                  </p>
                  {jobs && (
                    <Link
                      href={`/jobs/role/${row.category}`}
                      className="mt-2 inline-block font-sans text-sm font-semibold text-ink underline-offset-4 hover:underline"
                    >
                      {jobs.count.toLocaleString('en-US')} open roles →
                    </Link>
                  )}
                </div>
                <div className="mt-4 lg:mt-0">
                  <AxisLabels axis={axis} className="mb-1 lg:hidden" />
                  <RangeTrack
                    axis={axis}
                    low={row.lowK * 1000}
                    high={row.highK * 1000}
                    mid={row.medianK * 1000}
                  />
                  <RangeValues
                    values={[
                      { label: 'Low', value: row.lowK * 1000 },
                      { label: 'Median', value: row.medianK * 1000, key: true },
                      { label: 'High', value: row.highK * 1000 },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {(smallRanges.length > 0 || listings.uncategorizedCount > 0) && (
          <p className="mt-4 font-sans text-sm text-secondary">
            Left out:{' '}
            {[
              ...smallRanges.map(
                (row) => `${row.label} (${row.n} posting${row.n !== 1 ? 's' : ''}, too few to chart)`,
              ),
              ...(listings.uncategorizedCount > 0
                ? [`${listings.uncategorizedCount.toLocaleString('en-US')} postings with no role category`]
                : []),
            ].join('; ')}
            .
          </p>
        )}
      </Section>

      {/* 03 — State breakdown */}
      <Section
        id="by-state"
        index={3}
        eyebrow="By state"
        title="Nuclear engineer pay by state"
        intro={
          <p>
            Median nuclear engineer pay in the eight largest nuclear states, against the national
            median of ${NATIONAL_ENG_MEDIAN_K}k. Pay runs higher where utilities have large
            headquarters or new-build work, and lower under TVA pay scales.
          </p>
        }
      >
        <div
          aria-hidden="true"
          className={cn('hidden gap-x-4 pb-2 font-mono text-xs text-secondary md:grid', STATE_GRID)}
        >
          <span />
          <span>State</span>
          <span className="text-center">vs national median (${NATIONAL_ENG_MEDIAN_K}k)</span>
          <span className="text-right">Median</span>
          <span />
        </div>
        <ol className="divide-y divide-rule border-y border-rule">
          {stateRows.map((row, i) => {
            const width = (Math.abs(row.diffK) / diffScale) * 50;
            return (
              <li
                key={row.state}
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-3',
                  STATE_GRID,
                )}
              >
                <span className="hidden font-mono text-xs tabular-nums text-secondary md:block">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="font-sans text-sm font-semibold text-ink">{row.state}</p>
                  <p className="font-mono text-xs text-secondary">
                    {row.reactors} reactors{row.note && ` · ${row.note}`}
                  </p>
                </div>
                <span aria-hidden="true" className="relative hidden h-4 md:block">
                  <span className="absolute -inset-y-1 left-1/2 w-px bg-ink" />
                  {row.diffK !== 0 && (
                    <span
                      className={cn(
                        'absolute inset-y-0.5',
                        row.diffK > 0 ? 'border border-signal-border bg-signal' : 'bg-rule',
                      )}
                      style={
                        row.diffK > 0
                          ? { left: '50%', width: `${width}%` }
                          : { left: `${50 - width}%`, width: `${width}%` }
                      }
                    />
                  )}
                </span>
                <span className="text-right font-mono text-sm tabular-nums">
                  <span className="sr-only">Median </span>
                  <span className="font-semibold text-ink">${row.engMedianK}k</span>
                  <span className="sr-only">, difference from national median </span>
                  <span className="ml-3 inline-block w-12 text-secondary">{formatDiffK(row.diffK)}</span>
                </span>
                {row.slug && row.jobCount > 0 ? (
                  <Link
                    href={`/jobs/${row.slug}`}
                    className="font-sans text-sm font-semibold text-ink underline-offset-4 hover:underline md:text-right"
                  >
                    {row.jobCount.toLocaleString('en-US')} open roles →
                  </Link>
                ) : (
                  <span className="hidden md:block" />
                )}
              </li>
            );
          })}
        </ol>
      </Section>

      {/* 04 — Year-over-year trend */}
      <Section
        id="growth"
        index={4}
        eyebrow="2021–2025"
        title="Pay growth since 2021"
        intro={
          <p>
            Median pay rose for all three occupations between 2021 and 2025.{' '}
            {fastest.label} pay rose fastest, from {formatK(fastest.first.median)} to{' '}
            {formatK(fastest.last.median)}. Figures are nominal, not adjusted for inflation.
          </p>
        }
      >
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {trends.map((role) => (
            <div key={role.socCode} className="border-t border-rule pt-5">
              <h3 className="font-sans text-base font-semibold text-ink">{role.title}</h3>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="font-sans text-3xl font-bold tracking-tight tabular-nums text-ink">
                  +{role.growth}%
                </span>
                <span className="font-mono text-xs text-secondary">
                  {formatK(role.first.median)} → {formatK(role.last.median)}
                </span>
              </p>
              <ol className="mt-6 grid grid-cols-5 gap-2">
                {role.years.map((y, yi) => {
                  const isLatest = yi === role.years.length - 1;
                  const height = (y.median / trendMax) * 100;
                  return (
                    <li key={y.year} className="flex flex-col">
                      <span className="relative mt-6 block h-28 border-b border-ink">
                        <span
                          className={cn(
                            'absolute inset-x-0 text-center font-mono text-xs tabular-nums',
                            isLatest ? 'font-semibold text-ink' : 'text-secondary',
                          )}
                          style={{ bottom: `calc(${height}% + 0.25rem)` }}
                        >
                          <span className="sr-only">{y.year}: </span>
                          {formatK(y.median)}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute inset-x-0 bottom-0',
                            isLatest ? 'border border-b-0 border-signal-border bg-signal' : 'bg-rule',
                          )}
                          style={{ height: `${height}%` }}
                        />
                      </span>
                      <span aria-hidden="true" className="mt-2 text-center font-mono text-xs text-secondary">
                        {y.year}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      {/* Browse CTA */}
      <section className="border-b border-rule bg-surface py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-sans text-2xl font-bold tracking-tight text-ink">
              See what these roles pay today
            </h2>
            <p className="mt-2 font-sans text-base leading-relaxed text-secondary">
              {publishedCount.toLocaleString('en-US')} published nuclear roles, filterable by role,
              state, and operator. {listings.disclosingCount.toLocaleString('en-US')} state pay up
              front.
            </p>
          </div>
          <LinkButton href="/jobs" variant="primary" size="large" className="shrink-0">
            Browse {publishedCount.toLocaleString('en-US')} open roles
          </LinkButton>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-heading" className="border-b border-rule py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
          <div className="self-start lg:sticky lg:top-32">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              <span className="text-ink">05</span> · Common questions
            </p>
            <h2
              id="faq-heading"
              className="mt-2 font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl"
            >
              Nuclear salary FAQs
            </h2>
          </div>
          <div className="border-t border-rule">
            {FAQS.map((faq, i) => (
              <details key={faq.question} open={i === 0} className="group border-b border-rule">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
                  <h3 className="font-sans text-base font-semibold text-ink">{faq.question}</h3>
                  <span
                    aria-hidden="true"
                    className="relative size-3.5 shrink-0 text-secondary transition-colors group-hover:text-ink"
                  >
                    <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
                    <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-transform duration-150 group-open:rotate-90 group-open:opacity-0 motion-reduce:transition-none" />
                  </span>
                </summary>
                <p className="max-w-prose pb-5 font-sans text-base leading-relaxed text-secondary">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section aria-labelledby="methodology-heading" className="py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
          <div>
            <h2
              id="methodology-heading"
              className="font-mono text-xs uppercase tracking-widest text-secondary"
            >
              Methodology
            </h2>
            <a
              href="https://www.bls.gov/oes/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-xs text-ink underline-offset-4 hover:underline"
            >
              bls.gov/oes ↗
            </a>
          </div>
          <div className="max-w-prose space-y-4 font-sans text-sm leading-relaxed text-secondary">
            <p>
              <strong className="font-semibold text-ink">Occupation, state, and trend figures</strong>{' '}
              are from the Bureau of Labor Statistics Occupational Employment and Wage Statistics
              survey, May 2025 release, and earlier annual releases for the trend. Wages are medians
              across all employers and experience levels, and trend figures are not adjusted for
              inflation. Reactor counts are from the NRC list of operating units.
            </p>
            <p>
              <strong className="font-semibold text-ink">Posted pay</strong> comes from published
              jobs on Nuclear Hustle whose posting states a pay amount. A posted range uses its
              midpoint for the median. A single rate is used as-is. Hourly rates are annualised at
              2,080 hours. Low and high are the median of posted minimums and the median of posted
              maximums. Roles with fewer than 4 postings are left out of the chart.
            </p>
            <p>
              Companies that post pay are not a random sample of the industry.
              {listings.topEmployer
                ? ` ${listings.topEmployer.name} is ${listings.topEmployer.share}% of the listings that state pay.`
                : ''}{' '}
              Treat listing figures as directional, not representative of industry-wide pay.
            </p>
          </div>
        </div>
      </section>

      <JobAlertForm layout="bar" />
    </div>
  );
}
