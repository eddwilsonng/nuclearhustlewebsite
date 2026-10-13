import { Metadata } from 'next';
import Link from 'next/link';
import { getJobsIndexGeneratedAt, getPublishedJobsForSkills } from '@/lib/data/static';
import type { Job } from '@/lib/types';
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
import { LinkButton } from '@/components/ui/LinkButton';

// ── Data computation (runs at build time) ────────────────────────────────────

const jobs = getPublishedJobsForSkills();

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
    [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { certifications: rank(certs), clearances: rank(clears), skills: rank(skills) };
}

const jobsWithSkills = jobs.filter((j) => (j.structured_description?.skills?.length ?? 0) > 0);
const { certifications, clearances, skills } = aggregateFacets(jobs);
const topSkills = skills.slice(0, 20);

const CATEGORIES: Record<string, string> = {
  engineering: 'Engineering',
  operations: 'Operations',
  maintenance: 'Maintenance',
  'health-physics': 'Health Physics',
  administrative: 'Administrative',
  training: 'Training & Licensing',
  security: 'Security',
};

/** Below this, a role gets a caveat instead of a ranked list. */
const MIN_CATEGORY_SKILLED = 20;
const REPEATED_SKILL_MIN = 10;

type CategoryReport = {
  slug: string;
  label: string;
  total: number;
  skilled: number;
  skills: Ranked[];
  certifications: Ranked[];
};

function categoryReport(slug: string, label: string): CategoryReport {
  const catJobs = jobs.filter((j) => j.category === slug);
  const skilledJobs = catJobs.filter((j) => (j.structured_description?.skills?.length ?? 0) > 0);
  const facets = aggregateFacets(catJobs);
  return {
    slug,
    label,
    total: catJobs.length,
    skilled: skilledJobs.length,
    skills: facets.skills,
    certifications: facets.certifications,
  };
}

const categoryReports = Object.entries(CATEGORIES).map(([slug, label]) => categoryReport(slug, label));
const rankedCategories = categoryReports.filter(
  (row) => row.skills.length > 0 && row.skilled >= MIN_CATEGORY_SKILLED,
);
const thinCategories = categoryReports.filter((row) => row.skilled > 0 && row.skilled < MIN_CATEGORY_SKILLED);
const repeatedSkillCount = skills.filter((item) => item.count >= REPEATED_SKILL_MIN).length;

const pctOfSkilled = (count: number) =>
  jobsWithSkills.length === 0 ? 0 : Math.round((count / jobsWithSkills.length) * 100);

function formatCount(n: number) {
  return n.toLocaleString('en-US');
}

function formatAsOf(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

const asOfIso = getJobsIndexGeneratedAt();
const asOfLabel = asOfIso ? formatAsOf(asOfIso) : null;

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function certificationSummary(): string {
  const skilled = jobsWithSkills.length;
  const top = certifications.slice(0, 3);
  if (top.length === 0 || skilled === 0) return 'No tracked certification shows up in this set.';
  const [first, second, third] = top;
  let text = `${first.name} is the credential these listings name most often — ${formatCount(first.count)} of ${formatCount(skilled)} (${pctOfSkilled(first.count)}%).`;
  if (second && third) {
    text += ` ${second.name} follows at ${formatCount(second.count)} (${pctOfSkilled(second.count)}%), then ${third.name} at ${formatCount(third.count)} (${pctOfSkilled(third.count)}%).`;
  } else if (second) {
    text += ` ${second.name} follows at ${formatCount(second.count)} (${pctOfSkilled(second.count)}%).`;
  }

  const hot = rankedCategories
    .map((row) => {
      const hit = row.certifications.find((cert) => cert.name === first.name);
      if (!hit || row.skilled === 0) return null;
      const share = hit.count / row.skilled;
      return share >= 0.25
        ? { label: row.label, count: hit.count, skilled: row.skilled, share }
        : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.share - a.share)
    .slice(0, 2);

  if (hot.length > 0) {
    const bits = hot.map(
      (row) =>
        `${row.label} (${formatCount(row.count)} of ${formatCount(row.skilled)}, ${Math.round(row.share * 100)}%)`,
    );
    text += ` The share is highest in ${joinAnd(bits)}.`;
  }
  return text;
}

function clearanceSummary(): string {
  const skilled = jobsWithSkills.length;
  const named = clearances.filter((item) => item.count >= 5);
  if (named.length === 0 || skilled === 0) return '';
  const [first, ...rest] = named;
  let text = `${first.name} is the access line these listings actually write — ${formatCount(first.count)} of ${formatCount(skilled)} (${pctOfSkilled(first.count)}%).`;
  if (rest.length > 0) {
    text += ` ${rest.map((item) => `${item.name} is in ${formatCount(item.count)}`).join('. ')}.`;
  }
  return text;
}

function skillsSummary(): string {
  const skilled = jobsWithSkills.length;
  const [first, second, third, ...after] = skills.slice(0, 6);
  if (!first || skilled === 0) return 'No repeated skill stands out in this set.';
  let text = `${first.name} is the skill these listings name most often — ${formatCount(first.count)} of ${formatCount(skilled)} (${pctOfSkilled(first.count)}%).`;
  if (second && third) {
    text += ` ${second.name} (${formatCount(second.count)}, ${pctOfSkilled(second.count)}%) and ${third.name} (${formatCount(third.count)}, ${pctOfSkilled(third.count)}%) follow.`;
  }
  const next = after.slice(0, 3);
  if (next.length > 0) {
    text += ` After those: ${joinAnd(next.map((item) => `${item.name} (${formatCount(item.count)})`))}.`;
  }
  return text;
}

function categoryBlurb(row: CategoryReport): string {
  const top = row.skills.slice(0, 3);
  let text = `${joinAnd(top.map((item) => `${item.name} (${formatCount(item.count)})`))} ${top.length === 1 ? 'is' : 'are'} the ones that repeat.`;
  const hot = row.certifications
    .filter((cert) => row.skilled > 0 && cert.count / row.skilled >= 0.2)
    .slice(0, 2);
  if (hot.length === 2) {
    text += ` ${hot[0].name} is in ${formatCount(hot[0].count)} of ${formatCount(row.skilled)} listings here, and ${hot[1].name} is in ${formatCount(hot[1].count)}.`;
  } else if (hot.length === 1) {
    text += ` ${hot[0].name} is in ${formatCount(hot[0].count)} of ${formatCount(row.skilled)} listings here.`;
  } else if (row.certifications[0] && row.certifications[0].count >= 15) {
    text += ` ${row.certifications[0].name} is named in ${formatCount(row.certifications[0].count)} listings.`;
  }
  return text;
}

const certificationCopy = certificationSummary();
const clearanceCopy = clearanceSummary();
const skillsCopy = skillsSummary();

// ── Metadata ──────────────────────────────────────────────────────────────────

const metaLead = [certifications[0]?.name, ...skills.slice(0, 3).map((item) => item.name)]
  .filter(Boolean)
  .join(', ');

export const metadata: Metadata = {
  title: 'Most In-Demand Nuclear Skills & Certifications 2026 | Nuclear Hustle',
  description: `${metaLead} — ranked from ${formatCount(jobsWithSkills.length)} nuclear job listings with skill tags.`,
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
    <div className="border border-rule divide-y divide-rule">
      {items.map(({ name, count }, i) => (
        <div key={name} className="flex items-center gap-4 px-4 py-3 hover:bg-surface transition-colors">
          {numbered && <span className="font-mono text-xs text-secondary w-5 shrink-0">{i + 1}</span>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-xs font-semibold text-ink">{name}</span>
              <span className="font-mono text-xs text-secondary shrink-0 ml-3">
                {count} job{count !== 1 ? 's' : ''}
                {showShare ? ` · ${pctOfSkilled(count)}%` : ''}
              </span>
            </div>
            <div className="h-1.5 bg-rule">
              <div className="h-full bg-signal" style={{ width: `${(count / max) * 100}%` }} />
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
    <div className="min-h-screen bg-canvas">
      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbCurrent>Skills report</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Nuclear skills report</BrowseLabel>
        <BrowseTitle>What skills and certifications do nuclear employers ask for?</BrowseTitle>

        <BrowseDescription>
          {`Skill tags from ${formatCount(jobsWithSkills.length)} of ${formatCount(jobs.length)} published listings${asOfLabel ? `, as of ${asOfLabel}` : ''}. A listing counts once per skill.`}
        </BrowseDescription>
      </BrowsePageHeader>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-rule border border-rule mb-12">
          <div className="bg-canvas p-6">
            <p className="font-sans text-3xl font-bold text-ink">{formatCount(jobs.length)}</p>
            <p className="font-mono text-xs tracking-widest uppercase text-secondary mt-1">Listings total</p>
          </div>
          <div className="bg-canvas p-6">
            <p className="font-sans text-3xl font-bold text-ink">{coverage}%</p>
            <p className="font-mono text-xs tracking-widest uppercase text-secondary mt-1">With skills data</p>
          </div>
          <div className="bg-canvas p-6">
            <p className="font-sans text-3xl font-bold text-ink">{certifications.length}</p>
            <p className="font-mono text-xs tracking-widest uppercase text-secondary mt-1">Certifications tracked</p>
          </div>
          <div className="bg-canvas p-6">
            <p className="font-sans text-3xl font-bold text-ink">{formatCount(repeatedSkillCount)}</p>
            <p className="font-mono text-xs tracking-widest uppercase text-secondary mt-1">Skills in 10+ jobs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">

            {/* Certifications */}
            <section>
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Credentials</p>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink mb-3">Most-requested training &amp; certifications</h2>
              <p className="font-sans text-sm text-ink leading-relaxed mb-6">
                {certificationCopy}
              </p>
              <RankedList items={certifications} showShare />
            </section>

            {/* Clearances */}
            {clearances.length > 0 && (
              <section>
                <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Access</p>
                <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink mb-3">Security clearance &amp; site access</h2>
                <p className="font-sans text-sm text-ink leading-relaxed mb-6">
                  {clearanceCopy}
                </p>
                <RankedList items={clearances} showShare />
              </section>
            )}

            {/* Skills */}
            <section>
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">Most in demand</p>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink mb-3">Top 20 skills across all listings</h2>
              <p className="font-sans text-sm text-ink leading-relaxed mb-6">
                {skillsCopy}
              </p>
              <RankedList items={topSkills} showShare numbered />
              <p className="mt-2 font-sans text-sm text-secondary">
                Percent is the share of {formatCount(jobsWithSkills.length)} listings with skill tags.
                {' '}{formatCount(repeatedSkillCount)} skills show up in {REPEATED_SKILL_MIN} or more listings; one-off phrases stay out of this ranking.
                {asOfLabel ? ` As of ${asOfLabel}.` : ''}
              </p>
            </section>

            {/* By job category */}
            <section>
              <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-1">By role</p>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-ink mb-6">Top skills per job category</h2>

              <div className="space-y-8">
                {rankedCategories.map((row) => (
                  <div key={row.slug}>
                    <div className="flex items-baseline gap-3 mb-3">
                      <Link
                        href={`/jobs/role/${row.slug}`}
                        className="font-sans text-sm font-semibold text-ink underline-offset-2 hover:underline"
                      >
                        {row.label} →
                      </Link>
                      <span className="font-mono text-xs text-secondary">
                        {formatCount(row.skilled)} of {formatCount(row.total)} listings
                      </span>
                    </div>
                    <p className="font-sans text-sm text-ink leading-relaxed mb-3">{categoryBlurb(row)}</p>
                    <RankedList items={row.skills.slice(0, 5)} />
                  </div>
                ))}
              </div>
              {thinCategories.length > 0 && (
                <p className="mt-8 font-sans text-sm text-secondary">
                  {`${thinCategories
                    .map((row) => `${row.label} has ${formatCount(row.skilled)} listing${row.skilled === 1 ? '' : 's'} with skill tags`)
                    .join('. ')}. Too few to rank.`}
                </p>
              )}
            </section>

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">

              <div className="border border-signal bg-surface p-5">
                <p className="font-mono text-xs tracking-widest uppercase text-ink mb-2">Browse open roles</p>
                <p className="mb-4 font-sans text-sm leading-relaxed text-secondary">
                  Find nuclear jobs that match your skills and certifications.
                </p>
                <LinkButton href="/jobs" variant="primary" fullWidth>
                  Browse all jobs →
                </LinkButton>
              </div>

              <div className="border border-rule p-5 space-y-3">
                <p className="font-mono text-xs tracking-widest uppercase text-secondary">Browse by role</p>
                {Object.entries(CATEGORIES).map(([slug, label]) => (
                  <Link
                    key={slug}
                    href={`/jobs/role/${slug}`}
                    className="block font-mono text-xs text-secondary hover:text-ink transition-colors border-b border-rule pb-3 last:border-b-0 last:pb-0"
                  >
                    {label} →
                  </Link>
                ))}
              </div>

              <div className="border border-rule p-5">
                <p className="font-mono text-xs tracking-widest uppercase text-secondary mb-2">Also see</p>
                <Link
                  href="/nuclear-salary"
                  className="block font-mono text-xs text-secondary hover:text-ink transition-colors"
                >
                  Nuclear salary guide →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
