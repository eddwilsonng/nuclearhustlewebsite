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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; color: #57534E; max-width: 600px; margin: 0 auto 12px; padding: 12px 14px; background: #fff; border: 1px solid #CFC8BC; line-height: 1.5;">
      <strong style="color: #1C1917;">Preview</strong><br />
      ${jobs.length} job${jobs.length === 1 ? '' : 's'}<br />
      Subject: ${escapeHtml(subject)}<br />
      Preheader: ${escapeHtml(preheader)}
    </div>
  `;

  const previewHtml = bodyContent.replace(
    '<body style="margin: 0; padding: 0; background: #d8d2c8;">',
    `<body style="margin: 0; padding: 24px 12px; background: #d8d2c8;">${previewBar}`,
  );

  return new NextResponse(previewHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const dynamic = 'force-dynamic';
