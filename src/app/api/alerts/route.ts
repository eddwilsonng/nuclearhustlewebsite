import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import {
  buildWelcomeEmailHtml,
  welcomeEmailPlainText,
  welcomeEmailSubject,
} from '@/lib/email/templates/welcomeEmail';
import { unsubscribeUrl } from '@/lib/email/unsubscribe';

const schema = z.object({
  email: z.string().email().max(320),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    const { error: dbError } = await admin
      .from('job_alert_subscribers')
      .upsert({ email, unsubscribed_at: null }, { onConflict: 'email' });

    if (dbError) {
      console.error('[alerts] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Nuclear Hustle <jobs@nuclearhustle.com>',
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[alerts] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
