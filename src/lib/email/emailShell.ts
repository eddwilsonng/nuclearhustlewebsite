import { escapeHtml } from './escapeHtml';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

export function emailBrandHeader(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td style="padding-bottom: 24px;">
          <span style="font-family: monospace; font-size: 14px; color: #a8a29e;">##</span>
          <span style="font-family: monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #111; font-weight: bold; margin-left: 6px;">nuclearhustle</span>
        </td>
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 40px;">
      <tr>
        <td style="padding-top: 16px; border-top: 1px solid #CFC8BC;">
          <p style="font-family: monospace; font-size: 11px; color: #aaa; margin: 0; line-height: 1.6;">
            ${note}
            <a href="${unsubscribeHref}" style="color: #888;">Unsubscribe</a>
          </p>
          <p style="font-family: monospace; font-size: 10px; color: #bbb; margin: 8px 0 0;">
            <a href="${SITE_URL}" style="color: #bbb; text-decoration: none;">nuclearhustle.com</a>
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
        <td style="background: #facc15; padding: 12px 24px;">
          <a href="${href}" style="font-family: monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; color: #111; text-decoration: none; display: inline-block;">
            ${label}
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
  content: string;
}

export function wrapEmailShell({ preheader, unsubscribeHref, footerNote, content }: EmailShellOptions): string {
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
                  <td style="padding: 32px 24px; font-family: monospace; color: #111;">
                    ${emailBrandHeader()}
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

export function emailBodyOnly(content: string, unsubscribeHref: string, footerNote?: string): string {
  return `
    ${emailBrandHeader()}
    ${content}
    ${emailFooter(unsubscribeHref, footerNote)}
  `;
}
