import { legalSenderLines } from '@/lib/legal';
import { EMAIL_SANS, emailBodyOnly, emailPreheader, emailPrimaryCta } from '../emailShell';
import { unsubscribeUrl } from '../unsubscribe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

export function buildWelcomeEmailHtml(email: string): string {
  const unsub = unsubscribeUrl(email);

  const content = `
    ${emailPreheader(welcomeEmailPreheader())}
    <h1 style="font-family: ${EMAIL_SANS}; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #1C1917; margin: 0 0 12px;">
      You&apos;re on the list.
    </h1>
    <p style="font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 1.5; color: #57534E; margin: 0;">
      Every Monday we send the roles that went live that week, grouped by region.
    </p>
    ${emailPrimaryCta(`${SITE_URL}/jobs`, 'Browse open roles')}
  `;

  return emailBodyOnly(content, unsub, 'You signed up at nuclearhustle.com.');
}

export function welcomeEmailSubject(): string {
  return "You're on the list — Nuclear Hustle job alerts";
}

export function welcomeEmailPreheader(): string {
  return 'Each Monday: the roles that went live that week, grouped by region.';
}

export function welcomeEmailPlainText(email: string): string {
  return [
    "You're on the list.",
    '',
    'Every Monday we send the roles that went live that week, grouped by region.',
    '',
    `Browse open roles: ${SITE_URL}/jobs`,
    '',
    'This is an advertisement.',
    `Unsubscribe: ${unsubscribeUrl(email)}`,
    '',
    ...legalSenderLines(),
  ].join('\n');
}
