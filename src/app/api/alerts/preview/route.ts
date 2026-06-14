import { NextRequest, NextResponse } from 'next/server';
import { escapeHtml } from '@/lib/email/escapeHtml';
import {
  buildWeeklyDigestHtml,
  getWeeklyDigestJobs,
  weeklyDigestPreheader,
  weeklyDigestSubject,
} from '@/lib/email/weeklyDigest';

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const querySecret = request.nextUrl.searchParams.get('secret');
  const headerSecret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return querySecret === cronSecret || headerSecret === cronSecret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get('email') ?? 'you@example.com';
  const jobs = await getWeeklyDigestJobs();
  const subject = weeklyDigestSubject(jobs);
  const preheader = weeklyDigestPreheader(jobs);
  const bodyContent = buildWeeklyDigestHtml(jobs, email);

  const previewBar = `
    <div style="font-family: monospace; font-size: 11px; letter-spacing: 1px; color: #666; max-width: 600px; margin: 0 auto 12px; padding: 10px 14px; background: #fff; border: 1px solid #CFC8BC; line-height: 1.6;">
      <strong style="text-transform: uppercase; letter-spacing: 2px;">Preview</strong><br />
      ${jobs.length} job${jobs.length === 1 ? '' : 's'} &middot;
      Subject: ${escapeHtml(subject)}<br />
      Preheader: ${escapeHtml(preheader)}
    </div>
  `;

  const previewHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 24px 12px; background: #d8d2c8;">
    ${previewBar}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; width: 100%; background: #EDE8DF; border: 1px solid #CFC8BC;">
            <tr>
              <td style="padding: 32px 24px;">
                ${bodyContent}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return new NextResponse(previewHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const dynamic = 'force-dynamic';
