import { escapeHtml } from './escapeHtml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

export const EMAIL_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const EMAIL_MONO = "Consolas, 'Courier New', monospace";

export function emailBrandHeader(aside?: string): string {
  const dateCell = aside
    ? `<td align="right" style="padding-bottom: 28px; vertical-align: middle; font-family: ${EMAIL_MONO}; font-size: 12px; color: #57534E;">${escapeHtml(aside)}</td>`
    : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td style="padding-bottom: 28px; vertical-align: middle;">
          <a href="${SITE_URL}" style="font-family: ${EMAIL_SANS}; font-size: 16px; font-weight: 700; letter-spacing: -0.02em; color: #1C1917; text-decoration: none;">Nuclear Hustle</a>
        </td>
        ${dateCell}
      </tr>
    </table>
  `;
}

export function emailPreheader(text: string): string {
  const padded = `${escapeHtml(text)}${'&nbsp;'.repeat(80)}`;
  return `
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #EDE8DF;">
      ${padded}
    </div>
  `;
}

export function emailFooter(unsubscribeHref: string, footerNote?: string): string {
  const note =
    footerNote ??
    'You&apos;re receiving this because you signed up for Nuclear Hustle job alerts.';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 32px;">
      <tr>
        <td style="padding-top: 16px; border-top: 1px solid #CFC8BC;">
          <p style="font-family: ${EMAIL_SANS}; font-size: 12px; color: #57534E; margin: 0; line-height: 1.6;">
            ${note}
            <a href="${unsubscribeHref}" style="color: #57534E;">Unsubscribe</a>
          </p>
          <p style="font-family: ${EMAIL_SANS}; font-size: 12px; color: #57534E; margin: 8px 0 0;">
            <a href="${SITE_URL}" style="color: #57534E; text-decoration: none;">nuclearhustle.com</a>
          </p>
        </td>
      </tr>
    </table>
  `;
}

export function emailPrimaryCta(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
      <tr>
        <td style="background: #FACC15; border: 1px solid #FACC15;">
          <a href="${href}" style="font-family: ${EMAIL_SANS}; font-size: 14px; font-weight: 600; color: #1C1917; text-decoration: none; display: inline-block; padding: 14px 20px; line-height: 1.2;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

interface EmailShellOptions {
  preheader?: string;
  unsubscribeHref: string;
  footerNote?: string;
  headerAside?: string;
  content: string;
}

export function wrapEmailShell({
  preheader,
  unsubscribeHref,
  footerNote,
  headerAside,
  content,
}: EmailShellOptions): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body style="margin: 0; padding: 0; background: #d8d2c8;">
        ${preheader ? emailPreheader(preheader) : ''}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #d8d2c8;">
          <tr>
            <td align="center" style="padding: 24px 12px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; width: 100%; background: #EDE8DF; border: 1px solid #CFC8BC;">
                <tr>
                  <td style="padding: 32px 24px; font-family: ${EMAIL_SANS}; color: #1C1917;">
                    ${emailBrandHeader(headerAside)}
                    ${content}
                    ${emailFooter(unsubscribeHref, footerNote)}
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

export function emailBodyOnly(
  content: string,
  unsubscribeHref: string,
  footerNote?: string,
  headerAside?: string,
): string {
  return `
    ${emailBrandHeader(headerAside)}
    ${content}
    ${emailFooter(unsubscribeHref, footerNote)}
  `;
}
