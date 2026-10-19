import { escapeHtml } from './escapeHtml';
import { legalSenderLines } from '@/lib/legal';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

export const EMAIL_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
export const EMAIL_MONO = "Consolas, 'Courier New', monospace";

export function emailBrandHeader(aside?: string): string {
  const dateCell = aside
    ? `<td align="right" style="padding-bottom: 36px; vertical-align: baseline; font-family: ${EMAIL_MONO}; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #44403C;">${escapeHtml(aside)}</td>`
    : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td style="padding-bottom: 36px; vertical-align: baseline;">
          <a href="${SITE_URL}" style="font-family: ${EMAIL_SANS}; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; color: #1C1917; text-decoration: none;">Nuclear Hustle</a>
        </td>
        ${dateCell}
      </tr>
    </table>
  `;
}

export function emailPreheader(text: string): string {
  const padded = `${escapeHtml(text)}${'&nbsp;'.repeat(80)}`;
  return `
    <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #FFFFFF;">
      ${padded}
    </div>
  `;
}

export function emailFooter(unsubscribeHref: string, footerNote?: string): string {
  const note =
    footerNote ??
    'You&apos;re receiving this because you signed up for Nuclear Hustle job alerts.';
  const sender = legalSenderLines().map((line) => escapeHtml(line)).join('<br>');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 44px;">
      <tr>
        <td style="padding-top: 20px; border-top: 1px solid #E7E5E4;">
          <p style="font-family: ${EMAIL_SANS}; font-size: 12px; color: #57534E; margin: 0; line-height: 1.6;">
            This is an advertisement.
            ${note}
            <a href="${unsubscribeHref}" style="color: #57534E;">Unsubscribe</a>
          </p>
          <p style="font-family: ${EMAIL_SANS}; font-size: 12px; color: #57534E; margin: 8px 0 0; line-height: 1.6;">
            ${sender}
          </p>
        </td>
      </tr>
    </table>
  `;
}

export function emailPrimaryCta(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 28px;">
      <tr>
        <td style="border: 1px solid #1C1917;">
          <a href="${href}" style="font-family: ${EMAIL_SANS}; font-size: 15px; font-weight: 600; color: #1C1917; text-decoration: none; display: inline-block; padding: 12px 22px; line-height: 1.2;">
            ${escapeHtml(label)} &rarr;
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
  hero?: string;
  content: string;
}

export function wrapEmailShell({
  preheader,
  unsubscribeHref,
  footerNote,
  headerAside,
  hero,
  content,
}: EmailShellOptions): string {
  const heroBand = hero
    ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #EDE8DF; border-bottom: 1px solid #CFC8BC;">
          <tr>
            <td align="center" style="padding: 36px 12px 32px;">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 560px; width: 100%;">
                <tr>
                  <td style="padding: 0 20px; font-family: ${EMAIL_SANS}; color: #1C1917;">
                    ${emailBrandHeader(headerAside)}
                    ${hero}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body style="margin: 0; padding: 0; background: #FFFFFF;">
        ${preheader ? emailPreheader(preheader) : ''}
        ${heroBand}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #FFFFFF;">
          <tr>
            <td align="center" style="padding: ${hero ? '4px' : '40px'} 12px 40px;">
              <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 560px; width: 100%; background: #FFFFFF;">
                <tr>
                  <td style="padding: 0 20px; font-family: ${EMAIL_SANS}; color: #1C1917;">
                    ${hero ? '' : emailBrandHeader(headerAside)}
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
