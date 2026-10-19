import type { JobWithCompany } from '@/lib/types';
import { buildDigestModel, describeSection, digestRowMeta, type DigestSection } from '../digestModel';
import { EMAIL_SANS, emailPrimaryCta, wrapEmailShell } from '../emailShell';
import { escapeHtml } from '../escapeHtml';
import { weeklyDigestPreheader } from '../subjectLine';
import { legalSenderLines } from '@/lib/legal';
import { unsubscribeUrl } from '../unsubscribe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

function jobUrl(job: JobWithCompany): string {
  return `${SITE_URL}/job/${encodeURIComponent(job.slug)}`;
}

function renderJobItem(job: JobWithCompany, featured = false): string {
  const meta = escapeHtml(digestRowMeta(job, { markFeatured: !featured })).replace(
    / · /g,
    ' <span style="color: #D6D3D1;">·</span> ',
  );

  return `
    <li style="margin: 0 0 18px; padding-left: 6px; font-family: ${EMAIL_SANS}; color: #292524;">
      <a href="${jobUrl(job)}" style="font-family: ${EMAIL_SANS}; font-size: 16px; font-weight: 600; line-height: 1.4; color: #1C1917; text-decoration: underline; text-underline-offset: 2px;">
        ${escapeHtml(job.title)}
      </a>
      ${
        meta
          ? `<span style="display: block; font-family: ${EMAIL_SANS}; font-size: 14px; line-height: 1.5; color: #78716C; margin-top: 2px;">${meta}</span>`
          : ''
      }
    </li>
  `;
}

function renderJobList(jobs: JobWithCompany[], featured = false): string {
  if (jobs.length === 0) return '';
  return `
    <ul style="margin: 14px 0 0; padding: 0 0 0 22px; list-style: disc;">
      ${jobs.map((job) => renderJobItem(job, featured)).join('')}
    </ul>
  `;
}

function renderFeatured(jobs: JobWithCompany[]): string {
  if (jobs.length === 0) return '';
  return `
    <h2 style="font-family: ${EMAIL_SANS}; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; color: #1C1917; margin: 40px 0 0;">
      Featured listings
    </h2>
    <p style="font-family: ${EMAIL_SANS}; font-size: 15px; line-height: 1.6; color: #78716C; margin: 8px 0 0;">
      Sponsored roles from operators hiring now.
    </p>
    ${renderJobList(jobs, true)}
  `;
}

function joinHtml(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function renderSummary(section: DigestSection): string {
  const bits = section.states.map((state) => {
    const href = `${SITE_URL}/jobs/${state.slug}`;
    const name = `<a href="${href}" style="font-family: ${EMAIL_SANS}; font-weight: 600; color: #1C1917; text-decoration: underline; text-underline-offset: 2px;">${escapeHtml(state.name)}</a>`;
    return `${state.count} in ${name}`;
  });
  let where = joinHtml(bits);
  if (section.otherStateCount > 0) {
    const noun = section.otherStateCount === 1 ? 'state' : 'states';
    where = where ? `${where}, plus ${section.otherStateCount} other ${noun}` : `${section.otherStateCount} other ${noun}`;
  }
  const noun = section.total === 1 ? 'role' : 'roles';
  const text = where ? `${section.total} new ${noun}. ${where}.` : `${section.total} new ${noun}.`;
  return `<p style="font-family: ${EMAIL_SANS}; font-size: 15px; line-height: 1.6; color: #78716C; margin: 8px 0 0;">${text}</p>`;
}

function renderSection(section: DigestSection): string {
  return `
    <h2 style="font-family: ${EMAIL_SANS}; font-size: 19px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3; color: #1C1917; margin: 40px 0 0;">
      ${escapeHtml(section.label)}
    </h2>
    ${renderSummary(section)}
    ${renderJobList(section.listed)}
  `;
}

export function buildWeeklyDigestHtml(
  jobs: JobWithCompany[],
  email: string,
  featured: JobWithCompany[] = [],
): string {
  const model = buildDigestModel(jobs, featured);
  const preheader = weeklyDigestPreheader(jobs);
  const headerDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const intro = model.intro
    ? `<p style="font-family: ${EMAIL_SANS}; font-size: 18px; line-height: 1.55; color: #57534E; margin: 16px 0 0;">${escapeHtml(model.intro)}</p>`
    : '';

  const hero = `
    <h1 style="font-family: ${EMAIL_SANS}; font-size: 34px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.08; color: #1C1917; margin: 24px 0 0;">
      ${escapeHtml(model.heading)}
    </h1>
    ${intro}
  `;

  const content = `
    ${renderFeatured(model.featured)}
    ${model.sections.map(renderSection).join('')}
    ${emailPrimaryCta(`${SITE_URL}/jobs`, model.browseLabel)}
  `;

  return wrapEmailShell({
    preheader,
    unsubscribeHref: unsubscribeUrl(email),
    headerAside: headerDate,
    hero,
    content,
  });
}

export { weeklyDigestPreheader, weeklyDigestSubject } from '../subjectLine';

export function weeklyDigestPlainText(
  jobs: JobWithCompany[],
  email: string,
  featured: JobWithCompany[] = [],
): string {
  const model = buildDigestModel(jobs, featured);
  const lines = [model.heading];
  if (model.intro) lines.push('', model.intro);
  lines.push('');

  if (model.featured.length > 0) {
    lines.push('Featured listings', 'Sponsored roles from operators hiring now.', '');
    for (const job of model.featured) {
      lines.push(job.title, digestRowMeta(job, { markFeatured: false }), jobUrl(job), '');
    }
  }

  for (const section of model.sections) {
    lines.push(section.label, describeSection(section), '');
    for (const job of section.listed) {
      lines.push(job.title, digestRowMeta(job), jobUrl(job), '');
    }
    for (const state of section.states) {
      lines.push(`${state.name}: ${SITE_URL}/jobs/${state.slug}`);
    }
    lines.push('');
  }

  lines.push(
    `${model.browseLabel}: ${SITE_URL}/jobs`,
    '',
    'This is an advertisement.',
    `Unsubscribe: ${unsubscribeUrl(email)}`,
    '',
    ...legalSenderLines(),
  );
  return lines.join('\n');
}
