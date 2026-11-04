import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildWelcomeEmailHtml,
  welcomeEmailPlainText,
  welcomeEmailSubject,
} from '@/lib/email/templates/welcomeEmail';
import { unsubscribeUrl } from '@/lib/email/unsubscribe';

// The Monday digest list (job_alert_subscribers). Shared by the public alert
// form, job seeker onboarding and account settings so they all behave the same.

export async function isSubscribedToDigest(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('job_alert_subscribers')
    .select('unsubscribed_at')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return Boolean(data && !data.unsubscribed_at);
}

/** Subscribe, and send the welcome email the first time. Idempotent. */
export async function subscribeToDigest(rawEmail: string): Promise<{ ok: boolean }> {
  const email = rawEmail.toLowerCase();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('job_alert_subscribers')
    .select('unsubscribed_at')
    .eq('email', email)
    .maybeSingle();
  if (existing && !existing.unsubscribed_at) return { ok: true };

  const { error } = await admin
    .from('job_alert_subscribers')
    .upsert({ email, unsubscribed_at: null }, { onConflict: 'email' });
  if (error) {
    console.error('[digest] subscribe failed:', error.message);
    return { ok: false };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    await new Resend(resendApiKey).emails.send({
      from: 'Nuclear Hustle <jobs@nuclearhustle.com>',
      replyTo: 'nuclearhustle@gmail.com',
      to: email,
      subject: welcomeEmailSubject(),
      html: buildWelcomeEmailHtml(email),
      text: welcomeEmailPlainText(email),
      headers: {
        // Gmail/Yahoo bulk-sender rules require one-click list-unsubscribe.
        'List-Unsubscribe': `<${unsubscribeUrl(email)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  }
  return { ok: true };
}

export async function unsubscribeFromDigest(rawEmail: string): Promise<{ ok: boolean }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('job_alert_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', rawEmail.toLowerCase());
  if (error) {
    console.error('[digest] unsubscribe failed:', error.message);
    return { ok: false };
  }
  return { ok: true };
}
