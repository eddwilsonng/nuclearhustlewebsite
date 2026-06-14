import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildWeeklyDigestHtml,
  getWeeklyDigestJobs,
  weeklyDigestPlainText,
  weeklyDigestPreheader,
  weeklyDigestSubject,
} from '@/lib/email/weeklyDigest';

const BATCH_SIZE = 50;
const DIGEST_COOLDOWN_MS = 6 * 24 * 60 * 60 * 1000;

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  try {
    const jobs = await getWeeklyDigestJobs();
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: 'no_jobs' });
    }

    const admin = createAdminClient();
    const cooldownMs = Date.now() - DIGEST_COOLDOWN_MS;

    const { data: subscribers, error: subError } = await admin
      .from('job_alert_subscribers')
      .select('email, last_digest_sent_at')
      .is('unsubscribed_at', null);

    if (subError) {
      console.error('[weekly-digest] Subscriber fetch error:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    const eligible = (subscribers ?? []).filter((sub) => {
      if (!sub.last_digest_sent_at) return true;
      return new Date(sub.last_digest_sent_at).getTime() <= cooldownMs;
    });

    if (!eligible.length) {
      return NextResponse.json({ success: true, sent: 0, skipped: 'no_subscribers' });
    }

    const resend = new Resend(resendApiKey);
    const subject = weeklyDigestSubject(jobs);
    const preheader = weeklyDigestPreheader(jobs);
    let sent = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
      const batch = eligible.slice(i, i + BATCH_SIZE);
      const emails = batch.map((sub) => ({
        from: 'Nuclear Hustle <jobs@nuclearhustle.com>',
        to: sub.email,
        subject,
        html: buildWeeklyDigestHtml(jobs, sub.email),
        text: weeklyDigestPlainText(jobs, sub.email),
        headers: {
          'X-Entity-Ref-ID': `weekly-digest-${Date.now()}`,
        },
      }));

      const { error } = await resend.batch.send(emails);

      if (error) {
        console.error('[weekly-digest] Batch send error:', error);
        errors.push(error.message);
        continue;
      }

      const sentEmails = batch.map((sub) => sub.email);
      sent += batch.length;

      const now = new Date().toISOString();
      await admin
        .from('job_alert_subscribers')
        .update({ last_digest_sent_at: now })
        .in('email', sentEmails);
    }

    return NextResponse.json({
      success: true,
      sent,
      jobs: jobs.length,
      subscribers: eligible.length,
      subject,
      preheader,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('[weekly-digest] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
