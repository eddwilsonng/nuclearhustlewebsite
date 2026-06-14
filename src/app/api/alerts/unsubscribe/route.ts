import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

function unsubscribePage(message: string): NextResponse {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Unsubscribe — Nuclear Hustle</title>
        <style>
          body { font-family: monospace; background: #EDE8DF; color: #111; margin: 0; padding: 48px 24px; }
          .card { max-width: 480px; margin: 0 auto; border: 1px solid #CFC8BC; background: #EDE8DF; padding: 32px; }
          h1 { font-size: 20px; margin: 0 0 12px; }
          p { font-size: 13px; color: #555; line-height: 1.6; margin: 0 0 20px; }
          a { color: #111; }
        </style>
      </head>
      <body>
        <div class="card">
          <p style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin-bottom: 16px;">Nuclear Hustle</p>
          <h1>Job alerts</h1>
          <p>${message}</p>
          <a href="https://nuclearhustle.com/jobs">Browse open roles &rarr;</a>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    return unsubscribePage('Invalid unsubscribe link.');
  }

  const { email, token } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (!verifyUnsubscribeToken(normalizedEmail, token)) {
    return unsubscribePage('Invalid or expired unsubscribe link.');
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('job_alert_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('[unsubscribe] DB error:', error);
      return unsubscribePage('Something went wrong. Please try again.');
    }

    return unsubscribePage("You've been unsubscribed. You won't receive weekly job alerts anymore.");
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return unsubscribePage('Something went wrong. Please try again.');
  }
}
