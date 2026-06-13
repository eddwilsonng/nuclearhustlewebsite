import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

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

    const { email } = parsed.data;

    // Store in Supabase via service role (bypasses RLS)
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    const { error: dbError } = await admin
      .from('job_alert_subscribers')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

    if (dbError) {
      console.error('[alerts] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    // Send confirmation email if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Nuclear Hustle <jobs@nuclearhustle.com>',
        to: email,
        subject: "You're on the list — Nuclear Hustle job alerts",
        html: `
          <div style="font-family: monospace; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #EDE8DF;">
            <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin: 0 0 8px;">Nuclear Hustle</p>
            <h1 style="font-size: 22px; font-weight: bold; color: #111; margin: 0 0 24px; line-height: 1.3;">
              You're on the list.
            </h1>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px;">
              We'll email you when new nuclear industry roles land — operators, engineers,
              health physicists, maintenance, and more.
            </p>
            <a href="https://nuclearhustle.com/jobs"
               style="display: inline-block; background: #facc15; color: #111; font-family: monospace;
                      font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;
                      padding: 12px 24px; text-decoration: none;">
              Browse open roles &rarr;
            </a>
            <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #CFC8BC;">
              <p style="font-size: 11px; color: #aaa; margin: 0;">
                You signed up at <a href="https://nuclearhustle.com" style="color: #aaa;">nuclearhustle.com</a>.
                To unsubscribe, reply with "unsubscribe" in the subject line.
              </p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[alerts] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
