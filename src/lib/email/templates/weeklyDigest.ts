import { getCategoryInfo, JobCategory } from '@/lib/categorize';
import { getStateBySlug } from '@/lib/states';
import type { JobWithCompany } from '@/lib/types';
import { CATEGORY_ORDER, computeDigestStats, type DigestStats } from '../digestStats';
import { weeklyDigestPreheader } from '../subjectLine';
import { emailBodyOnly, emailPreheader, emailPrimaryCta } from '../emailShell';
import { escapeHtml } from '../escapeHtml';
import { formatPostedLabel, isNewThisWeek } from '../formatPostedLabel';
import { unsubscribeUrl } from '../unsubscribe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';
const MAX_PER_CATEGORY = 5;
const MAX_FEATURED = 3;

function getCompanyInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatJobLocation(job: JobWithCompany): string {
  const stateName = job.state ? getStateBySlug(job.state)?.name : null;
  if (stateName && !job.location.toLowerCase().includes(stateName.toLowerCase())) {
    return `${job.location}, ${stateName}`;
  }
  return job.location;
}

function jobOneLiner(job: JobWithCompany): string | null {
  const about = job.structured_description?.about;
  if (!about) return null;
  const firstSentence = about.split(/(?<=[.!?])\s+/)[0] ?? about;
  const trimmed = firstSentence.trim();
  if (trimmed.length <= 120) return trimmed;
  return `${trimmed.slice(0, 117).trim()}…`;
}

function isFeaturedJob(job: JobWithCompany): boolean {
  return Boolean(
    job.is_featured && job.featured_until && new Date(job.featured_until) > new Date()
  );
}

function isDirectJob(job: JobWithCompany): boolean {
  return Boolean(job.isEmployerJob && !isFeaturedJob(job));
}

function jobUrl(job: JobWithCompany): string {
  return `${SITE_URL}/job/${encodeURIComponent(job.slug)}`;
}

function badge(label: string, style: 'featured' | 'direct' | 'category' | 'new'): string {
  const styles = {
    featured: 'border: 1px solid #facc15; background: #fef9c3; color: #a16207;',
    direct: 'border: 1px solid #fde68a; background: #fffbeb; color: #ca8a04;',
    category: 'border: 1px solid #CFC8BC; background: #E5DFD5; color: #57534e;',
    new: 'border: 1px solid #CFC8BC; background: #fff; color: #44403c;',
  };

  return `<span style="font-family: monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 6px; margin-right: 4px; white-space: nowrap; ${styles[style]}">${escapeHtml(label)}</span>`;
}

function renderBadges(job: JobWithCompany, showCategory = true): string {
  const badges: string[] = [];
  if (isFeaturedJob(job)) badges.push(badge('Featured', 'featured'));
  else if (isDirectJob(job)) badges.push(badge('Direct', 'direct'));
  if (isNewThisWeek(job.scraped_at)) badges.push(badge('New', 'new'));
  if (showCategory && job.category !== 'other') {
    badges.push(badge(getCategoryInfo(job.category).name, 'category'));
  }
  if (!badges.length) return '';
  return `<div style="margin-top: 6px; line-height: 1.8;">${badges.join('')}</div>`;
}

function renderJobCard(job: JobWithCompany, options: { highlighted?: boolean; showCategory?: boolean } = {}): string {
  const { highlighted = false, showCategory = true } = options;
  const initials = escapeHtml(getCompanyInitials(job.company.name));
  const title = escapeHtml(job.title);
  const company = escapeHtml(job.company.name);
  const location = escapeHtml(formatJobLocation(job));
  const url = jobUrl(job);
  const oneLiner = jobOneLiner(job);
  const posted = formatPostedLabel(job.scraped_at);
  const avatarBg = job.isEmployerJob ? '#fef9c3' : '#E5DFD5';
  const avatarBorder = job.isEmployerJob ? '#fde68a' : '#CFC8BC';
  const avatarColor = job.isEmployerJob ? '#ca8a04' : '#a8a29e';
  const leftBorder = highlighted ? 'border-left: 3px solid #facc15;' : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 12px; border: 1px solid #CFC8BC; background: #EDE8DF; ${leftBorder}">
      <tr>
        <td style="padding: 14px; vertical-align: top; width: 48px;">
          <div style="width: 40px; height: 40px; border: 1px solid ${avatarBorder}; background: ${avatarBg}; text-align: center; line-height: 40px; font-family: monospace; font-size: 11px; font-weight: bold; color: ${avatarColor};">
            ${initials}
          </div>
        </td>
        <td style="padding: 14px 14px 14px 0; vertical-align: top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top;">
                <a href="${url}" style="font-family: monospace; font-size: 14px; font-weight: bold; color: #111; text-decoration: none; line-height: 1.4; display: block;">
                  ${title}
                </a>
              </td>
              <td style="vertical-align: top; text-align: right; white-space: nowrap; padding-left: 8px;">
                <span style="font-family: monospace; font-size: 10px; color: #a8a29e;">${escapeHtml(posted)}</span>
              </td>
            </tr>
          </table>
          <p style="font-family: monospace; font-size: 11px; color: #78716c; margin: 4px 0 0; line-height: 1.5;">
            ${company} <span style="color: #CFC8BC;">//</span> ${location}
          </p>
          ${renderBadges(job, showCategory)}
          ${
            oneLiner
              ? `<p style="font-family: monospace; font-size: 11px; color: #57534e; margin: 8px 0 0; line-height: 1.5;">${escapeHtml(oneLiner)}</p>`
              : ''
          }
          <p style="margin: 8px 0 0;">
            <a href="${url}" style="font-family: monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #111; text-decoration: none; font-weight: bold;">
              View role &rarr;
            </a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

function renderStatsStrip(stats: DigestStats): string {
  const topHiring = escapeHtml(stats.topCategoryHiring);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0 28px; border: 1px solid #CFC8BC;">
      <tr>
        <td style="padding: 12px 8px; text-align: center; border-right: 1px solid #CFC8BC; width: 33%;">
          <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #111; margin: 0;">${stats.totalJobs}</p>
          <p style="font-family: monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #a8a29e; margin: 4px 0 0;">Roles</p>
        </td>
        <td style="padding: 12px 8px; text-align: center; border-right: 1px solid #CFC8BC; width: 33%;">
          <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #111; margin: 0;">${stats.stateCount}</p>
          <p style="font-family: monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #a8a29e; margin: 4px 0 0;">States</p>
        </td>
        <td style="padding: 12px 8px; text-align: center; width: 34%;">
          <p style="font-family: monospace; font-size: 11px; font-weight: bold; color: #111; margin: 0; line-height: 1.3;">${topHiring}</p>
          <p style="font-family: monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #a8a29e; margin: 4px 0 0;">Top hiring</p>
        </td>
      </tr>
    </table>
  `;
}

function renderHero(stats: DigestStats): string {
  const weekLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return `
    <h1 style="font-family: monospace; font-size: 22px; font-weight: bold; margin: 0 0 4px; line-height: 1.3; color: #111;">
      This week&apos;s open roles
    </h1>
    <p style="font-family: monospace; font-size: 12px; color: #78716c; margin: 0 0 0;">
      ${weekLabel}${stats.newThisWeek > 0 ? ` &mdash; ${stats.newThisWeek} new this week` : ''}
    </p>
    ${renderStatsStrip(stats)}
  `;
}

function pickFeaturedJobs(jobs: JobWithCompany[]): JobWithCompany[] {
  return [...jobs]
    .filter((job) => isFeaturedJob(job) || isDirectJob(job))
    .sort((a, b) => {
      const aScore = isFeaturedJob(a) ? 2 : isDirectJob(a) ? 1 : 0;
      const bScore = isFeaturedJob(b) ? 2 : isDirectJob(b) ? 1 : 0;
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
    })
    .slice(0, MAX_FEATURED);
}

function groupJobsByCategory(jobs: JobWithCompany[]): Map<JobCategory, JobWithCompany[]> {
  const grouped = new Map<JobCategory, JobWithCompany[]>();
  for (const job of jobs) {
    const list = grouped.get(job.category) ?? [];
    list.push(job);
    grouped.set(job.category, list);
  }
  return grouped;
}

function renderFeaturedSection(jobs: JobWithCompany[]): string {
  if (!jobs.length) return '';

  const cards = jobs.map((job) => renderJobCard(job, { highlighted: true, showCategory: true })).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
      <tr>
        <td>
          <p style="font-family: monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #ca8a04; margin: 0 0 12px; font-weight: bold;">
            &#9733; Featured &amp; Direct
          </p>
          ${cards}
        </td>
      </tr>
    </table>
  `;
}

function renderCategorySections(
  jobs: JobWithCompany[],
  excludeIds: Set<string>
): string {
  const remaining = jobs.filter((job) => !excludeIds.has(job.id));
  const grouped = groupJobsByCategory(remaining);
  const sections: string[] = [];

  for (const category of CATEGORY_ORDER) {
    const categoryJobs = grouped.get(category);
    if (!categoryJobs?.length) continue;

    const name = getCategoryInfo(category).name.toUpperCase();
    const slice = categoryJobs.slice(0, MAX_PER_CATEGORY);
    const cards = slice.map((job) => renderJobCard(job, { showCategory: false })).join('');

    sections.push(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
        <tr>
          <td>
            <p style="font-family: monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #78716c; margin: 0 0 12px; font-weight: bold; border-bottom: 1px solid #CFC8BC; padding-bottom: 8px;">
              ${escapeHtml(name)} &middot; ${slice.length} role${slice.length === 1 ? '' : 's'}
            </p>
            ${cards}
          </td>
        </tr>
      </table>
    `);
  }

  return sections.join('');
}

function renderDiscoveryLinks(stats: DigestStats): string {
  const links = stats.topCategories.slice(0, 4).map((name) => {
    const category = CATEGORY_ORDER.find(
      (cat) => getCategoryInfo(cat).name === name
    );
    if (!category) return '';
    const href = `${SITE_URL}/jobs/role/${category}`;
    return `<a href="${href}" style="font-family: monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #57534e; text-decoration: none; margin-right: 12px;">${escapeHtml(name)}</a>`;
  }).filter(Boolean).join('');

  if (!links) return '';

  return `
    <p style="font-family: monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: #a8a29e; margin: 16px 0 8px;">
      Browse by role
    </p>
    <p style="margin: 0; line-height: 2;">
      ${links}
    </p>
  `;
}

export function buildWeeklyDigestHtml(jobs: JobWithCompany[], email: string): string {
  const stats = computeDigestStats(jobs);
  const featured = pickFeaturedJobs(jobs);
  const featuredIds = new Set(featured.map((job) => job.id));
  const unsub = unsubscribeUrl(email);

  const preheader = weeklyDigestPreheader(jobs);

  const content = `
    ${emailPreheader(preheader)}
    ${renderHero(stats)}
    ${renderFeaturedSection(featured)}
    ${renderCategorySections(jobs, featuredIds)}
    ${emailPrimaryCta(`${SITE_URL}/jobs`, 'Browse all jobs &rarr;')}
    ${renderDiscoveryLinks(stats)}
  `;

  return emailBodyOnly(content, unsub);
}

export { weeklyDigestPreheader, weeklyDigestSubject } from '../subjectLine';

export function weeklyDigestPlainText(jobs: JobWithCompany[], email: string): string {
  const stats = computeDigestStats(jobs);
  const lines = [
    `This week's open roles — ${stats.totalJobs} roles across ${stats.stateCount} states`,
    '',
    ...jobs.map((job) => {
      const url = jobUrl(job);
      return `- ${job.title} at ${job.company.name} (${formatJobLocation(job)})\n  ${url}`;
    }),
    '',
    `Browse all jobs: ${SITE_URL}/jobs`,
    '',
    `Unsubscribe: ${unsubscribeUrl(email)}`,
  ];
  return lines.join('\n');
}
