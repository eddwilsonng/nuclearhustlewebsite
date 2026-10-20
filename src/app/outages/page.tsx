import { Metadata } from 'next';
import Link from 'next/link';
import plantsData from '@/data/plants.json';
import {
  BrowseBreadcrumb,
  BrowseBreadcrumbCurrent,
  BrowseBreadcrumbLink,
  BrowseLabel,
  BrowseTitle,
} from '@/components/BrowsePageHeader';
import { JobAlertForm } from '@/components/JobAlertForm';
import { SectionIndex } from '@/components/SectionIndex';
import { FleetSnapshot, type FleetFigure, type FleetSegment } from '@/components/outages/FleetSnapshot';
import {
  FORECAST_HORIZON_DAYS,
  ForecastScale,
  ForecastTrack,
  OutageProgress,
} from '@/components/outages/OutageTracks';
import { PlantList } from '@/components/outages/PlantList';
import { ScheduleTable, type ScheduleRow } from '@/components/outages/ScheduleTable';
import MapLoader from '@/components/status/MapLoader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { US_STATES } from '@/lib/states';
import { getActiveStates } from '@/lib/data/static';
import { NRC_POWER_STATUS_URL } from '@/lib/outages/config';
import { calendarDays, shiftIsoDate } from '@/lib/outages/dates';
import { getFleetReadings, unitsForPlant } from '@/lib/outages/fleet';
import {
  confidenceLabel,
  cycleMonths,
  formatCompactWindow,
  formatLongDate,
  outageTypeLabel,
  seasonOf,
} from '@/lib/outages/format';
import { getOutageSchedule, type ScheduleUnit } from '@/lib/outages/schedule';
import { generateBreadcrumbSchema, generateDatasetSchema, generateFaqSchema } from '@/lib/seo/schema';
import {
  countUnitStates,
  highestUnitState,
  plantRollupLabel,
  type UnitSnapshot,
  type UnitState,
} from '@/lib/outages/unitState';

export type UnitStatus = UnitSnapshot;

const OUTAGES_DESCRIPTION =
  "Which US nuclear reactors are in outage now and when each unit's next refueling outage is expected, updated daily from NRC data. Plus jobs near every outage.";
const OUTAGES_PATH = '/outages';

const SECTIONS = [
  { id: 'in-outage', label: 'In outage' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'fleet', label: 'All reactors' },
  { id: 'faq', label: 'FAQ' },
] as const;

function seasonSpan(date = new Date()): string {
  const year = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(date),
  );
  return `${year}-${String(year + 1).slice(2)}`;
}

export function generateMetadata(): Metadata {
  const title = `Nuclear outage schedule ${seasonSpan()}: every US reactor | Nuclear Hustle`;
  return {
    title,
    description: OUTAGES_DESCRIPTION,
    alternates: { canonical: OUTAGES_PATH },
    openGraph: {
      title,
      description: OUTAGES_DESCRIPTION,
      url: OUTAGES_PATH,
      type: 'website',
      siteName: 'Nuclear Hustle',
      locale: 'en_US',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@nuclearhustle',
      title,
      description: OUTAGES_DESCRIPTION,
      images: ['/opengraph-image'],
    },
  };
}

// Revalidate every hour
export const revalidate = 3600;

export interface PlantWithStatus {
  id: string;
  name: string;
  state: string;
  city: string;
  operator: string;
  lat: number;
  lng: number;
  units: UnitStatus[];
  avgPower: number | null;
  /** Highest-priority unit state. Marker color and sort use this, not the average. */
  status: UnitState;
  rollupLabel: string;
  jobCount: number;          // open jobs in this plant's state (0 = none)
  stateSlug: string | null;  // /jobs/[stateSlug], null if unmapped
}

export interface FleetStats {
  reportDate: string;
  totalUnits: number;
  fullPower: number;
  reduced: number;
  coastdown: number;
  offline: number;
  unplanned: number;
  maintenance: number;
  refueling: number;
  extended: number;
  unknown: number;
  restarting: number;
  fleetCapacity: number | null;
}


export default async function OutagesPage() {
  const [readings, schedule] = await Promise.all([getFleetReadings(), getOutageSchedule()]);
  const reportDate = readings.reportDate;
  const span = seasonSpan();

  // Open-job counts per state, so we only link plants where work actually
  // exists (most reactor states have no listings — linking them all dead-ends).
  const jobCountByCode = new Map<string, number>();
  for (const { state, count } of getActiveStates()) {
    if (state?.code) jobCountByCode.set(state.code, count);
  }

  // Enrich plant data with live status. A plant is labeled by its
  // highest-priority unit, never by the average of its units.
  const plants: PlantWithStatus[] = plantsData.plants.map(plant => {
    const isRestarting = (plant as { restarting?: boolean }).restarting === true;
    const units = unitsForPlant(plant.units, readings, isRestarting);
    const knownUnits = units.filter(u => u.power !== null);
    const avgPower = knownUnits.length > 0
      ? Math.round(knownUnits.reduce((s, u) => s + u.power!, 0) / knownUnits.length)
      : null;

    return {
      ...plant,
      units,
      avgPower,
      status: highestUnitState(units.map(u => u.state)),
      rollupLabel: plantRollupLabel(units),
      jobCount: jobCountByCode.get(plant.state) ?? 0,
      stateSlug: US_STATES.find(s => s.code === plant.state)?.slug ?? null,
    };
  });

  // "Hiring now" summary — distinct reactor states that have open roles.
  const hiringByState = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of plants) {
    if (p.jobCount > 0 && p.stateSlug && !hiringByState.has(p.state)) {
      hiringByState.set(p.state, {
        slug: p.stateSlug,
        name: US_STATES.find(s => s.code === p.state)?.name ?? p.state,
        count: p.jobCount,
      });
    }
  }
  const hiringChips = [...hiringByState.values()].sort((a, b) => b.count - a.count);
  const hiringJobTotal = hiringChips.reduce((s, c) => s + c.count, 0);

  // Header buckets are the same unit states the list labels use.
  const counts = countUnitStates(plants.flatMap(p => p.units.map(u => u.state)));
  const knownPowers = plants
    .flatMap(p => p.units)
    .filter(u => u.state !== 'restarting' && u.power !== null);
  const fleetCapacity = knownPowers.length > 0
    ? Math.round(knownPowers.reduce((s, u) => s + u.power!, 0) / knownPowers.length)
    : null;

  const stats: FleetStats = {
    reportDate,
    totalUnits:
      counts.full +
      counts.reduced +
      counts.coastdown +
      counts.offline +
      counts.unplanned +
      counts.maintenance +
      counts.refueling_outage +
      counts.extended_shutdown +
      counts.unknown,
    fullPower: counts.full,
    reduced: counts.reduced,
    coastdown: counts.coastdown,
    offline: counts.offline,
    unplanned: counts.unplanned,
    maintenance: counts.maintenance,
    refueling: counts.refueling_outage,
    extended: counts.extended_shutdown,
    unknown: counts.unknown,
    restarting: counts.restarting,
    fleetCapacity,
  };

  const asOf = schedule?.reportDate ?? '';
  const reportLabel = asOf ? formatLongDate(asOf) : reportDate.split(' ')[0];
  const inOutage = (schedule?.units ?? [])
    .filter((unit) => unit.current)
    .sort((a, b) => {
      const aRank = a.current?.type === 'refueling' ? 0 : 1;
      const bRank = b.current?.type === 'refueling' ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return (a.current?.startDate ?? '').localeCompare(b.current?.startDate ?? '');
    });
  const otherDown = stats.offline + stats.unplanned + stats.maintenance;
  const upcoming = (schedule?.units ?? [])
    .filter(
      (unit) =>
        !unit.current &&
        unit.forecast &&
        asOf &&
        unit.forecast.forecastStart <= shiftIsoDate(asOf, FORECAST_HORIZON_DAYS),
    )
    .sort((a, b) => {
      if (a.forecast?.dueNow !== b.forecast?.dueNow) return a.forecast?.dueNow ? -1 : 1;
      return (a.forecast?.forecastStart ?? '').localeCompare(b.forecast?.forecastStart ?? '');
    });
  const startingNext30 = upcoming.filter(
    (unit) => unit.forecast?.dueNow || (unit.forecast && unit.forecast.forecastStart <= shiftIsoDate(asOf, 30)),
  ).length;
  const scheduleRows = scheduleRowsFrom(schedule?.units ?? [], asOf);
  const seasonalShare =
    schedule && schedule.refuelingCount > 0
      ? Math.round((schedule.seasonalRefuelingCount / schedule.refuelingCount) * 100)
      : null;

  const figures: FleetFigure[] = [
    {
      label: 'In outage now',
      value: String(stats.refueling + otherDown),
      detail: `${stats.refueling} refueling · ${otherDown} other`,
    },
    {
      label: 'Fleet capacity',
      value: stats.fleetCapacity !== null ? `${stats.fleetCapacity}%` : 'n/a',
      detail: 'Average output, all units',
    },
    {
      label: 'Full power',
      value: String(stats.fullPower),
      detail: `of ${stats.totalUnits} operating units`,
    },
    {
      label: 'Next 30 days',
      value: String(startingNext30),
      detail: 'Refueling windows opening',
    },
  ];
  const segments: FleetSegment[] = [
    { label: 'Full power', count: stats.fullPower, swatch: 'bg-success', alwaysShow: true },
    { label: 'Reduced', count: stats.reduced, swatch: 'bg-signal', alwaysShow: true },
    { label: 'Coasting down', count: stats.coastdown, swatch: 'bg-signal-border' },
    { label: 'Refueling', count: stats.refueling, swatch: 'bg-danger', alwaysShow: true },
    { label: 'Unplanned', count: stats.unplanned, swatch: 'bg-danger/70', alwaysShow: true },
    { label: 'Offline', count: stats.offline + stats.maintenance, swatch: 'bg-danger/45', alwaysShow: true },
    { label: 'Extended', count: stats.extended, swatch: 'bg-muted' },
    { label: 'Restarting', count: stats.restarting, swatch: 'bg-ink', alwaysShow: true },
    { label: 'No data', count: stats.unknown, swatch: 'bg-rule' },
  ];

  const faqs = [
    {
      question: 'When is nuclear outage season?',
      answer: `Refueling starts cluster in spring and fall. Of ${schedule?.refuelingCount ?? 0} refueling outages in this record, ${schedule?.seasonalRefuelingCount ?? 0}${seasonalShare !== null ? ` (${seasonalShare}%)` : ''} started in February through May or September through November.`,
    },
    {
      question: 'How long does a refueling outage last?',
      answer: `${
        schedule?.medianRefuelingDays
          ? `The median completed refueling in the last five years lasted ${schedule.medianRefuelingDays} days, across ${schedule.refuelingSample} outages.`
          : 'We do not have enough completed refuelings in the last five years to give a median yet.'
      } A length of 14 to 90 days is the range we treat as a normal refueling.`,
    },
    {
      question: 'How often do reactors refuel?',
      answer: `${
        schedule?.medianCycleDays
          ? `Across units with at least two measured gaps, the median cycle is ${cycleMonths(schedule.medianCycleDays)} months.`
          : 'We need two measured gaps on a unit before we will quote a cycle.'
      } The schedule uses each unit's own gaps, not this fleet median.`,
    },
    {
      question: 'How are these dates forecast?',
      answer:
        "We add a unit's median refueling gap to its last refueling start, then place a window around that date. If the date has passed and the unit is not in an outage, the row says Due now for up to 90 days. The date is an estimate from NRC history. It is not a schedule published by the operator.",
    },
  ];
  const keyFigures = [
    schedule?.medianRefuelingDays
      ? { value: `${schedule.medianRefuelingDays} days`, label: 'Median refueling length' }
      : null,
    schedule?.medianCycleDays
      ? { value: `${cycleMonths(schedule.medianCycleDays)} months`, label: 'Median time between refuelings' }
      : null,
    seasonalShare !== null ? { value: `${seasonalShare}%`, label: 'Start in spring or fall' } : null,
  ].filter((figure) => figure !== null);

  const dataset = generateDatasetSchema({
    name: `US nuclear outage schedule ${span}`,
    description: OUTAGES_DESCRIPTION,
    temporalCoverage: asOf ? `1999-01-01/${asOf}` : '1999/2026',
    dateModified: asOf || newYorkToday(),
    isBasedOn: NRC_POWER_STATUS_URL,
  });
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.nuclearhustle.com' },
    { name: 'Nuclear outage schedule', url: 'https://www.nuclearhustle.com/outages' },
  ]);
  const faqSchema = generateFaqSchema(faqs);

  return (
    <div className="min-h-screen bg-canvas">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <header className="bg-surface pt-12">
        <div className="mx-auto max-w-6xl px-6">
          <BrowseBreadcrumb>
            <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
            <span aria-hidden="true">/</span>
            <BrowseBreadcrumbCurrent>Nuclear outage schedule</BrowseBreadcrumbCurrent>
          </BrowseBreadcrumb>

          <BrowseLabel>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              Live data · NRC report {reportLabel}
            </span>
          </BrowseLabel>
          <BrowseTitle>Nuclear outage schedule {span}</BrowseTitle>
          <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-secondary text-pretty">
            Which US reactors are down for refueling now, which go next, and how long each outage usually runs. Know where the work will be before the outage starts.
          </p>

          <FleetSnapshot figures={figures} segments={segments} />
        </div>
      </header>

      <SectionIndex items={SECTIONS} />

      <Section
        id="in-outage"
        index={1}
        eyebrow="Now"
        title="In outage now"
        intro={
          <p>
            Reactors currently offline for refueling or maintenance, how far through each outage they are, and when they&apos;re expected back online.
          </p>
        }
      >
        {inOutage.length === 0 ? (
          <EmptyState>
            No unit is at 0% power on this report. The next windows to open are{' '}
            <a href="#upcoming" className="font-semibold text-ink underline underline-offset-2">
              in the next 90 days
            </a>
            .
          </EmptyState>
        ) : (
          <div className="overflow-x-auto border border-rule">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Reactors at zero power on the latest NRC report</caption>
              <thead>
                <tr className="border-b border-rule bg-surface">
                  <ColumnHeader>Unit</ColumnHeader>
                  <ColumnHeader className="hidden sm:table-cell">Type</ColumnHeader>
                  <ColumnHeader className="sm:w-[38%]">Progress</ColumnHeader>
                  <ColumnHeader className="hidden sm:table-cell">Expected return</ColumnHeader>
                </tr>
              </thead>
              <tbody>
                {inOutage.map((unit) => {
                  const over = overrunDays(unit, asOf);
                  const typical = typicalLength(unit);
                  const day = unit.current?.dayOfOutage ?? 0;
                  const type = outageTypeLabel(unit.current?.type ?? 'unknown');
                  return (
                    <tr key={unit.unitId} className="border-b border-rule align-top last:border-b-0">
                      <th scope="row" className="px-3 py-4 font-normal sm:px-4">
                        <UnitName href={`/plants/${unit.plantSlug}#outages`} plant={unit.plantName} unit={unit.unitLabel} />
                        <p className="mt-0.5 font-mono text-xs text-secondary sm:hidden">{type}</p>
                      </th>
                      <td className="hidden px-3 py-4 sm:px-4 sm:table-cell">
                        <Badge tone={unit.current?.type === 'unplanned' ? 'danger' : 'neutral'}>{type}</Badge>
                      </td>
                      <td className="px-3 py-4 sm:px-4">
                        <p className="font-sans text-sm font-semibold tabular-nums text-ink">{progressLabel(unit)}</p>
                        <OutageProgress day={over > 0 || !typical ? day : Math.min(day, typical)} typical={typical} />
                        {unit.current && (
                          <p className="mt-2 font-mono text-xs text-secondary">
                            Started {formatLongDate(unit.current.startDate)}
                          </p>
                        )}
                        <div className="mt-1 sm:hidden">
                          <ReturnCell label={returnLabel(unit, asOf)} over={over} compact />
                        </div>
                      </td>
                      <td className="hidden px-3 py-4 sm:px-4 sm:table-cell">
                        <ReturnCell label={returnLabel(unit, asOf)} over={over} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        id="upcoming"
        index={2}
        eyebrow="Forecast"
        title="Starting in the next 90 days"
        intro={
          <p>
            Refueling outages forecast to start in the next three months, based on each unit&apos;s past refueling cycle. Forecasts are estimates, not operator schedules.{' '}
            <a href="#methodology" className="text-ink underline underline-offset-2 hover:no-underline">
              How we forecast
            </a>
          </p>
        }
      >
        {upcoming.length === 0 ? (
          <EmptyState>
            No refueling window opens in the next 90 days. Every unit&apos;s next window is in the{' '}
            <a href="#schedule" className="font-semibold text-ink underline underline-offset-2">
              full schedule
            </a>
            .
          </EmptyState>
        ) : (
          <div className="overflow-x-auto border border-rule">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Refueling forecasts inside 90 days</caption>
              <thead>
                <tr className="border-b border-rule bg-surface">
                  <ColumnHeader>Unit</ColumnHeader>
                  <ColumnHeader>Window</ColumnHeader>
                  <ColumnHeader className="hidden w-[34%] md:table-cell">
                    <span className="sr-only">Timeline</span>
                    <ForecastScale />
                  </ColumnHeader>
                  <ColumnHeader>Confidence</ColumnHeader>
                  <ColumnHeader className="hidden sm:table-cell">Typical length</ColumnHeader>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((unit) => {
                  const forecast = unit.forecast;
                  return (
                    <tr key={unit.unitId} className="border-b border-rule align-top last:border-b-0">
                      <th scope="row" className="px-3 py-4 font-normal sm:px-4">
                        <UnitName href={`/plants/${unit.plantSlug}#outages`} plant={unit.plantName} unit={unit.unitLabel} />
                      </th>
                      <td className="px-3 py-4 sm:px-4 font-sans text-sm text-ink">
                        {forecast?.dueNow ? (
                          <span className="font-semibold">Due now</span>
                        ) : forecast ? (
                          formatCompactWindow(forecast.windowStart, forecast.windowEnd)
                        ) : (
                          'n/a'
                        )}
                      </td>
                      <td className="hidden px-4 py-5 md:table-cell">
                        {forecast && (
                          <ForecastTrack
                            windowStart={calendarDays(asOf, forecast.windowStart)}
                            windowEnd={calendarDays(asOf, forecast.windowEnd)}
                            start={forecast.dueNow ? 0 : calendarDays(asOf, forecast.forecastStart)}
                            emphasis={forecast.confidence === 'coastdown'}
                          />
                        )}
                      </td>
                      <td className="px-3 py-4 sm:px-4">
                        {forecast?.confidence === 'coastdown' ? (
                          <Badge tone="featured">{confidenceLabel(forecast.confidence)}</Badge>
                        ) : (
                          <span className="font-sans text-sm text-secondary">
                            {confidenceLabel(forecast?.confidence ?? 'forecast')}
                          </span>
                        )}
                      </td>
                      <td className="hidden px-3 py-4 sm:px-4 font-mono text-xs tabular-nums text-ink sm:table-cell">
                        {forecast ? `~${forecast.durationDays} days` : 'n/a'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        id="schedule"
        index={3}
        eyebrow="All units"
        title="Full schedule"
        intro={
          <p>
            The next refueling window for every operating unit. Look up a plant, or filter by season, state, or operator.
          </p>
        }
      >
        <ScheduleTable rows={scheduleRows} />
      </Section>

      <Section
        id="fleet"
        index={4}
        eyebrow="Live fleet status"
        title="Operating units"
        intro={
          <p>
            Every commercial nuclear plant in the US, colored by the status of its units. A yellow ring marks states with open roles.
          </p>
        }
      >
        {/* Hiring-now summary — links only to states that actually have openings */}
        {hiringChips.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 border border-rule bg-surface py-4 sm:px-4">
            <p className="shrink-0 px-4 font-sans text-sm text-secondary sm:px-0">
              <span className="font-semibold text-ink">Hiring now</span>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              {hiringJobTotal} roles at plants in {hiringChips.length} states
            </p>
            {/* One sideways row on phones; wraps from sm up. */}
            <ul className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
              {hiringChips.map(chip => (
                <li key={chip.slug} className="shrink-0">
                  <Link
                    href={`/jobs/${chip.slug}`}
                    className="inline-flex min-h-9 items-center gap-2 border border-control bg-raised px-3 font-sans text-sm whitespace-nowrap text-ink transition-colors duration-150 hover:border-ink hover:bg-canvas"
                  >
                    {chip.name}
                    <span className="font-mono text-xs font-bold tabular-nums">{chip.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border border-rule">
          <MapLoader plants={plants} />
        </div>
      </Section>

      {/* Plant-by-plant breakdown */}
      <Section
        id="all-reactors"
        eyebrow="Plant breakdown"
        title="All reactors"
        intro={
          <p>
            Each plant with its units&apos; output on the latest report, grouped by status. Open a plant for its full outage history.
          </p>
        }
      >
        <PlantList plants={plants} />

        <p className="mt-8 font-mono text-xs text-secondary">
          Source: US Nuclear Regulatory Commission daily power reactor status report.{' '}
          <a
            href={NRC_POWER_STATUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2 hover:no-underline"
          >
            NRC source ↗
          </a>
        </p>
      </Section>

      <section id="faq" aria-labelledby="faq-heading" className="border-b border-rule py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
          <div className="self-start lg:sticky lg:top-32">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              <span className="text-ink">05</span> · Questions
            </p>
            <h2 id="faq-heading" className="mt-2 font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl text-balance">
              Outage season, length, and cycle
            </h2>
            {keyFigures.length > 0 && (
              <dl className="mt-8 grid grid-cols-1 gap-5 border-t border-rule pt-6 sm:grid-cols-3 lg:grid-cols-1">
                {keyFigures.map((figure) => (
                  <div key={figure.label}>
                    <dt className="font-mono text-xs text-secondary">{figure.label}</dt>
                    <dd className="mt-1 font-sans text-3xl font-bold tracking-tight tabular-nums text-ink">
                      {figure.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="border-t border-rule">
            {faqs.map((faq) => (
              <div key={faq.question} className="border-b border-rule py-6">
                <h3 className="font-sans text-lg font-semibold text-ink">{faq.question}</h3>
                <p className="mt-2 max-w-prose font-sans text-base leading-relaxed text-secondary">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="methodology" aria-labelledby="methodology-heading" className="py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
          <div className="self-start lg:sticky lg:top-32">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">How this page is built</p>
            <h2 id="methodology-heading" className="mt-2 font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Methodology
            </h2>
            <a
              href={NRC_POWER_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-xs text-ink underline-offset-4 hover:underline"
            >
              NRC power reactor status ↗
            </a>
          </div>
          <div className="self-start border border-rule font-sans text-base leading-relaxed text-secondary">
            <MethodBlock title="Sources" open>
              <p>
                Power figures come from the NRC daily reactor status report. We store one row per operating unit from 1999 through the report dated {reportLabel}. The reason text comes from the NRC&apos;s daily pages, which add a comment about 28 days after the power figure. Those comments cover the last five years.
              </p>
            </MethodBlock>
            <MethodBlock title="Detection">
              <p>
                An outage is a run of days at 0% power. A hole of up to 3 days with no report stays in the same outage. If the unit comes back below 30% for 3 days or fewer and then returns to 0%, that is still one outage.
              </p>
            </MethodBlock>
            <MethodBlock title="Classification">
              <p>Each outage gets a score from the signals below.</p>
              <table className="mt-4 w-full border-collapse border-y border-rule text-left text-sm">
                <caption className="sr-only">Outage classification score</caption>
                <thead>
                  <tr className="border-b border-rule">
                    <th scope="col" className="py-2 pr-4 font-mono text-xs font-normal uppercase tracking-widest text-secondary">
                      Signal
                    </th>
                    <th scope="col" className="py-2 text-right font-mono text-xs font-normal uppercase tracking-widest text-secondary">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CLASSIFICATION_SIGNALS.map(([signal, points]) => (
                    <tr key={signal} className="border-b border-rule last:border-b-0">
                      <td className="py-2.5 pr-4 text-secondary">{signal}</td>
                      <td className="py-2.5 text-right font-mono text-sm font-bold tabular-nums whitespace-nowrap text-ink">
                        {points > 0 ? `adds ${points}` : `subtracts ${Math.abs(points)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="mt-4 flex flex-col gap-1.5 text-base">
                <li>A score of 4 or more is a refueling.</li>
                <li>A maintenance comment without a refueling comment is maintenance.</li>
                <li>A score of 0 or less under 14 days is unplanned.</li>
                <li>Anything else stays offline: we do not have enough to name it.</li>
              </ul>
            </MethodBlock>
            <MethodBlock title="Forecasts">
              <p>
                For a unit that is not in a refueling outage, the next start is the last refueling start plus the median gap between its last five refueling starts. The window is that date, plus or minus the larger of 21 days and the spread of those gaps. With fewer than two gaps, we use 18 months. If that date is already past and the unit is still up, we show &quot;Due now&quot; for up to 90 days, then step forward by whole cycles. We do not show a forecast date that has already passed.
              </p>
            </MethodBlock>
            <MethodBlock title="Confidence">
              <p>
                Forecast is the cycle estimate. Coasting down means the unit is already losing power in the pattern that usually comes before a refueling. Once the outage has started, the unit leaves the forecast table and appears under in outage now.
              </p>
            </MethodBlock>
            <MethodBlock title="Updates">
              <p>
                We read the NRC file twice a day. The date on this page is the report date in that file.
              </p>
            </MethodBlock>
            <MethodBlock title="Limits">
              <p>
                The NRC describes the daily status report as unevaluated information. Nuclear Hustle is not the NRC and is not affiliated with any plant operator. A forecast is an estimate from past outages. It is not a date the operator has scheduled.
              </p>
            </MethodBlock>
          </div>
        </div>
      </section>

      <JobAlertForm layout="bar" />
    </div>
  );
}

const CLASSIFICATION_SIGNALS: [string, number][] = [
  ['A comment containing "refueling" in the 45 days before the start, or during the outage', 3],
  ['A coastdown in the 30 days before the start', 2],
  ['A gap of 15 to 26 months since the previous refueling', 2],
  ['A start in February through May, or September through November', 1],
  ['A length of 14 to 90 days', 1],
  ['A scram on the start date, or a comment that names a scram or a reactor trip', -3],
  ['A length under 10 days', -2],
];

function Section({
  id,
  index,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  index?: number;
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
            {index !== undefined && (
              <>
                <span className="text-ink">{String(index).padStart(2, '0')}</span> ·{' '}
              </>
            )}
            {eyebrow}
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

function ColumnHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th scope="col" className={cn('px-3 py-3 font-mono text-xs font-normal sm:px-4 uppercase tracking-widest text-secondary', className)}>
      {children}
    </th>
  );
}

function UnitName({ href, plant, unit }: { href: string; plant: string; unit: string }) {
  return (
    <>
      <Link href={href} className="font-sans text-sm font-semibold text-ink hover:underline">
        {plant}
      </Link>
      {unit !== plant && <p className="font-mono text-xs text-secondary">{unit}</p>}
    </>
  );
}

function ReturnCell({ label, over, compact }: { label: string; over: number; compact?: boolean }) {
  const overText = over > 0 ? `${over} ${over === 1 ? 'day' : 'days'} over` : null;
  if (compact) {
    return (
      <p className={cn('font-mono text-xs', over > 0 ? 'font-semibold text-danger' : 'text-secondary')}>
        {label === 'n/a' ? null : over > 0 ? `${label}, ${overText}` : `Back ${label}`}
      </p>
    );
  }
  return (
    <>
      <p className={cn('font-sans text-sm', over > 0 ? 'font-semibold text-danger' : 'text-ink')}>{label}</p>
      {overText && <p className="mt-0.5 font-mono text-xs tabular-nums text-secondary">{overText}</p>}
    </>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-rule px-6 py-8 font-sans text-base text-secondary">{children}</p>
  );
}

function MethodBlock({
  title,
  open,
  children,
}: {
  title: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-rule last:border-b-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 transition-colors duration-150 marker:content-none hover:bg-surface [&::-webkit-details-marker]:hidden">
        <h3 className="font-sans text-base font-semibold text-ink">{title}</h3>
        <span
          aria-hidden="true"
          className="relative size-3.5 shrink-0 text-secondary transition-colors group-hover:text-ink"
        >
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
          <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-transform duration-150 group-open:rotate-90 group-open:opacity-0 motion-reduce:transition-none" />
        </span>
      </summary>
      <div className="max-w-prose px-5 pb-6">{children}</div>
    </details>
  );
}

function typicalLength(unit: ScheduleUnit): number | null {
  if (unit.current?.type !== 'refueling' || !unit.current.expectedReturn) return null;
  return calendarDays(unit.current.startDate, unit.current.expectedReturn);
}

function overrunDays(unit: ScheduleUnit, asOf: string): number {
  const typical = typicalLength(unit);
  const day = unit.current?.dayOfOutage;
  if (!typical || !day || !asOf || !unit.current?.expectedReturn) return 0;
  if (unit.current.expectedReturn >= asOf) return 0;
  return Math.max(day - typical, 0);
}

function progressLabel(unit: ScheduleUnit): string {
  if (unit.current?.type !== 'refueling' || !unit.current.expectedReturn || !unit.current.dayOfOutage) {
    return unit.current?.dayOfOutage ? `Day ${unit.current.dayOfOutage}` : 'n/a';
  }
  const typical = calendarDays(unit.current.startDate, unit.current.expectedReturn);
  return `Day ${unit.current.dayOfOutage} of ~${typical}`;
}

function returnLabel(unit: ScheduleUnit, asOf: string): string {
  if (unit.current?.type !== 'refueling' || !unit.current.expectedReturn) return 'n/a';
  if (asOf && unit.current.expectedReturn < asOf) return 'Past the usual length';
  return `~${formatLongDate(unit.current.expectedReturn)}`;
}

function scheduleRowsFrom(units: ScheduleUnit[], asOf: string): ScheduleRow[] {
  return units.map((unit) => {
    const windowDate = unit.forecast?.dueNow ? asOf : unit.forecast?.forecastStart ?? '9999-12-31';
    const season = seasonOf(unit.forecast?.forecastStart ?? '') ?? 'other';
    const windowKind: ScheduleRow['windowKind'] = unit.current
      ? 'in_outage'
      : unit.forecast?.dueNow
        ? 'due'
        : unit.forecast
          ? 'forecast'
          : 'none';
    return {
      key: unit.unitId,
      href: `/plants/${unit.plantSlug}#outages`,
      unit: unit.unitLabel,
      plant: unit.plantName,
      state: unit.stateName,
      operator: unit.operator,
      lastRefueling: unit.lastRefueling ? formatLongDate(unit.lastRefueling.startDate) : 'None on record',
      cycle: unit.cycleDays ? `${cycleMonths(unit.cycleDays)} months` : 'Default 18 months',
      window: unit.current
        ? 'In outage'
        : unit.forecast?.dueNow
          ? 'Due now'
          : unit.forecast
            ? formatCompactWindow(unit.forecast.windowStart, unit.forecast.windowEnd)
            : 'n/a',
      windowKind,
      confidence: unit.current ? 'Started' : confidenceLabel(unit.forecast?.confidence ?? 'forecast'),
      coasting: unit.forecast?.confidence === 'coastdown',
      season: unit.current
        ? (seasonOf(unit.current.startDate) ?? 'other')
        : unit.forecast?.dueNow
          ? (seasonOf(asOf) ?? 'other')
          : season,
      sortWindow: windowDate,
      sortLast: unit.lastRefueling?.startDate ?? '',
      sortCycle: unit.cycleDays ?? 548,
    };
  });
}

function newYorkToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
