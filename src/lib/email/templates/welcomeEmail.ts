import { emailBodyOnly, emailPreheader, emailPrimaryCta } from '../emailShell';
import { unsubscribeUrl } from '../unsubscribe';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

export function buildWelcomeEmailHtml(email: string): string {
  const unsub = unsubscribeUrl(email);

  const content = `
    ${emailPreheader(welcomeEmailPreheader())}
    <h1 style="font-family: monospace; font-size: 22px; font-weight: bold; color: #111; margin: 0 0 16px; line-height: 1.3;">
      You&apos;re on the list.
    </h1>
    <p style="font-family: monospace; font-size: 13px; color: #57534e; line-height: 1.7; margin: 0 0 8px;">
      Every Monday we&apos;ll send you a curated digest of the latest nuclear industry roles — reactor operators, engineers, health physicists, maintenance, and more.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; border: 1px solid #CFC8BC;">
      <tr>
        <td style="padding: 14px 16px;">
          <p style="font-family: monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #a8a29e; margin: 0 0 6px;">What to expect</p>
          <p style="font-family: monospace; font-size: 12px; color: #44403c; margin: 0; line-height: 1.6;">
            Featured &amp; direct employer listings, roles grouped by category, and links to every open position on the board.
          </p>
        </td>
      </tr>
    </table>
    ${emailPrimaryCta(`${SITE_URL}/jobs`, 'Browse open roles &rarr;')}
  `;

  return emailBodyOnly(
    content,
    unsub,
    'You signed up at nuclearhustle.com.'
  );
}

export function welcomeEmailSubject(): string {
  return "You're on the list — Nuclear Hustle job alerts";
}

export function welcomeEmailPreheader(): string {
  return 'Weekly nuclear job digest every Monday — operators, engineers, maintenance, and more.';
}

export function welcomeEmailPlainText(email: string): string {
  return [
    "You're on the list.",
    '',
    "Every Monday we'll send you a curated digest of the latest nuclear industry roles.",
    '',
    `Browse open roles: ${SITE_URL}/jobs`,
    '',
    `Unsubscribe: ${unsubscribeUrl(email)}`,
  ].join('\n');
}
