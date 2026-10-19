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

function renderJob(job: JobWithCompany, featured = false): string {
  const meta = escapeHtml(digestRowMeta(job, { markFeatured: !featured })).replace(
    / · /g,
    ' <span style="color: #CFC8BC;">·</span> ',
  );
  const rule = featured
    ? `<td width="3" style="width: 3px; background: #FACC15; border-bottom: 1px solid #CFC8BC; font-size: 0; line-height: 0;">&nbsp;</td>`
    : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        ${rule}
        <td style="padding: 12px 0 12px ${featured ? '12px' : '0'}; border-bottom: 1px solid #CFC8BC;">
          <a href="${jobUrl(job)}" style="font-family: ${EMAIL_SANS}; font-size: 16px; font-weight: 600; line-height: 1.35; color: #1C1917; text-decoration: none;">
            ${escapeHtml(job.title)}
          </a>
          ${
            meta
              ? `<p style="font-family: ${EMAIL_SANS}; font-size: 14px; line-height: 1.45; color: #57534E; margin: 3px 0 0;">${meta}</p>`
              : ''
          }
        </td>
      </tr>
    </table>
  `;
}

function renderFeatured(jobs: JobWithCompany[]): string {
  if (jobs.length === 0) return '';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 28px;">
      <tr>
        <td>
          <h2 style="font-family: ${EMAIL_SANS}; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; color: #1C1917; margin: 0 0 4px;">
            Featured listings
          </h2>
          <p style="font-family: ${EMAIL_SANS}; font-size: 15px; line-height: 1.55; color: #57534E; margin: 0 0 8px;">
            Sponsored roles from operators hiring now.
          </p>
          ${jobs.map((job) => renderJob(job, true)).join('')}
        </td>
      </tr>
    </table>
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
    const name = `<a href="${href}" style="font-family: ${EMAIL_SANS}; font-weight: 600; color: #1C1917; text-decoration: underline;">${escapeHtml(state.name)}</a>`;
    return `${state.count} in ${name}`;
  });
  let where = joinHtml(bits);
  if (section.otherStateCount > 0) {
    const noun = section.otherStateCount === 1 ? 'state' : 'states';
    where = where ? `${where}, plus ${section.otherStateCount} other ${noun}` : `${section.otherStateCount} other ${noun}`;
  }
  const noun = section.total === 1 ? 'role' : 'roles';
  const text = where ? `${section.total} new ${noun}. ${where}.` : `${section.total} new ${noun}.`;
  return `<p style="font-family: ${EMAIL_SANS}; font-size: 15px; line-height: 1.55; color: #57534E; margin: 0 0 8px;">${text}</p>`;
}

function renderSection(section: DigestSection): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 28px;">
      <tr>
        <td>
          <h2 style="font-family: ${EMAIL_SANS}; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; color: #1C1917; margin: 0 0 4px;">
            ${escapeHtml(section.label)}
          </h2>
          ${renderSummary(section)}
          ${section.listed.map((job) => renderJob(job)).join('')}
        </td>
      </tr>
    </table>
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
    month: 'short',
    day: 'numeric',
  });

  const intro = model.intro
    ? `<p style="font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 1.6; color: #1C1917; margin: 0;">${escapeHtml(model.intro)}</p>`
    : '';
  const closer = model.closer
    ? `<p style="font-family: ${EMAIL_SANS}; font-size: 15px; line-height: 1.55; color: #57534E; margin: 28px 0 0;">${escapeHtml(model.closer)}</p>`
    : '';

  const content = `
    <h1 style="font-family: ${EMAIL_SANS}; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #1C1917; margin: 0 0 8px;">
      ${escapeHtml(model.heading)}
    </h1>
    ${intro}
    ${renderFeatured(model.featured)}
    ${model.sections.map(renderSection).join('')}
    ${closer}
    ${emailPrimaryCta(`${SITE_URL}/jobs`, model.browseLabel)}
  `;

  return wrapEmailShell({
    preheader,
    unsubscribeHref: unsubscribeUrl(email),
    headerAside: headerDate,
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

  if (model.closer) lines.push(model.closer, '');
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
