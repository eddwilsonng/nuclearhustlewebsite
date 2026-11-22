import { legalSenderLines } from '@/lib/legal';
import { EMAIL_MONO, EMAIL_SANS, emailBrandHeader, emailPreheader, emailPrimaryCta } from '../emailShell';
import { escapeHtml } from '../escapeHtml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

// Account emails are transactional: no unsubscribe link and no advertising
// notice, because the person asked for this specific message.
function transactionalShell(preheader: string, content: string): string {
  const sender = legalSenderLines().map((line) => escapeHtml(line)).join('<br>');
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body style="margin: 0; padding: 0; background: #FFFFFF;">
        ${emailPreheader(preheader)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 12px;">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 560px; width: 100%;">
                <tr>
                  <td style="padding: 0 20px; font-family: ${EMAIL_SANS}; color: #1C1917;">
                    ${emailBrandHeader()}
                    ${content}
                    <p style="font-family: ${EMAIL_SANS}; font-size: 12px; color: #57534E; margin: 44px 0 0; padding-top: 20px; border-top: 1px solid #E7E5E4; line-height: 1.6;">
                      ${sender}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

const H1 = `font-family: ${EMAIL_SANS}; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; color: #1C1917; margin: 0;`;
const P = `font-family: ${EMAIL_SANS}; font-size: 16px; line-height: 1.65; color: #292524; margin: 12px 0 0;`;

export function verificationCodeEmail(code: string) {
  const subject = `${code} is your Nuclear Hustle code`;
  const html = transactionalShell(
    `Enter ${code} to confirm your work email. It expires in 10 minutes.`,
    `
      <h1 style="${H1}">Confirm your work email</h1>
      <p style="${P}">Enter this code on Nuclear Hustle to finish setting up your employer account. It expires in 10 minutes.</p>
      <p style="font-family: ${EMAIL_MONO}; font-size: 32px; font-weight: 700; letter-spacing: 0.3em; color: #1C1917; margin: 28px 0 0;">${escapeHtml(code)}</p>
      <p style="${P}">We confirm employer addresses before listings go live, so candidates know a real company is behind each job. If you didn't sign up, ignore this email.</p>
    `,
  );
  const text = [
    'Confirm your work email',
    '',
    `Your code: ${code}`,
    'It expires in 10 minutes.',
    '',
    "If you didn't sign up for Nuclear Hustle, ignore this email.",
    '',
    ...legalSenderLines(),
  ].join('\n');
  return { subject, html, text };
}

export function applicationConfirmationEmail({
  applicantName,
  jobTitle,
  companyName,
  jobSlug,
  hasAccount,
}: {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  jobSlug: string;
  hasAccount: boolean;
}) {
  const firstName = applicantName.split(' ')[0] || applicantName;
  const subject = `Application sent: ${jobTitle}`;
  const trackLine = hasAccount
    ? 'You can see it under My applications, along with whether the employer has reviewed it.'
    : 'Create a free account next time you apply and we will keep a record of every application for you.';
  const ctaHref = hasAccount ? `${SITE_URL}/dashboard/applications` : `${SITE_URL}/job/${jobSlug}`;
  const ctaLabel = hasAccount ? 'View my applications' : 'View the listing';

  const html = transactionalShell(
    `${companyName} has your application for ${jobTitle}.`,
    `
      <h1 style="${H1}">${escapeHtml(companyName)} has your application</h1>
      <p style="${P}">Hi ${escapeHtml(firstName)}, we sent your application for <strong>${escapeHtml(jobTitle)}</strong> to ${escapeHtml(companyName)} along with your CV. Replies come from the employer directly to this address.</p>
      <p style="${P}">${escapeHtml(trackLine)}</p>
      ${emailPrimaryCta(ctaHref, ctaLabel)}
    `,
  );
  const text = [
    `${companyName} has your application`,
    '',
    `Hi ${firstName}, we sent your application for ${jobTitle} to ${companyName} along with your CV. Replies come from the employer directly to this address.`,
    '',
    trackLine,
    `${ctaLabel}: ${ctaHref}`,
    '',
    ...legalSenderLines(),
  ].join('\n');
  return { subject, html, text };
}
