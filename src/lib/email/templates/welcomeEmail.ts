import { legalSenderLines } from '@/lib/legal';
import { EMAIL_SANS, emailBodyOnly, emailPreheader, emailPrimaryCta } from '../emailShell';
import { unsubscribeUrl } from '../unsubscribe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

export function buildWelcomeEmailHtml(email: string): string {
  const unsub = unsubscribeUrl(email);

  const content = `
    ${emailPreheader(welcomeEmailPreheader())}
    <h1 style="font-family: ${EMAIL_SANS}; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; color: #1C1917; margin: 0;">
      You&apos;re on the list.
    </h1>
    <p style="font-family: ${EMAIL_SANS}; font-size: 17px; line-height: 1.65; color: #292524; margin: 12px 0 0;">
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
