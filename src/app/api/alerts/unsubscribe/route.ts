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
          body { font-family: ui-sans-serif, system-ui, sans-serif; background: #ede8df; color: #1c1917; margin: 0; padding: 48px 24px; }
          .card { max-width: 480px; margin: 0 auto; border: 1px solid #cfc8bc; background: #ede8df; padding: 32px; }
          .eyebrow { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #57534e; margin: 0 0 16px; }
          h1 { font-size: 28px; line-height: 1.15; margin: 0 0 12px; }
          p { font-size: 16px; color: #57534e; line-height: 1.65; margin: 0 0 20px; }
          a { color: #1c1917; }
        </style>
      </head>
      <body>
        <div class="card">
          <p class="eyebrow">Nuclear Hustle</p>
          <h1>Job alerts</h1>
          <p>${message}</p>
          <a href="https://www.nuclearhustle.com/jobs">Browse open roles &rarr;</a>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// Performs the unsubscribe for a verified email. Returns null on success,
// or an error message string to surface to the caller.
async function performUnsubscribe(normalizedEmail: string): Promise<string | null> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('job_alert_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', normalizedEmail);

  if (error) {
    console.error('[unsubscribe] DB error:', error);
    return 'Something went wrong. Please try again.';
  }

  return null;
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
    const errorMessage = await performUnsubscribe(normalizedEmail);
    if (errorMessage) return unsubscribePage(errorMessage);
    return unsubscribePage("You've been unsubscribed. You won't receive weekly job alerts anymore.");
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return unsubscribePage('Something went wrong. Please try again.');
  }
}

// One-click unsubscribe (RFC 8058). Gmail/Yahoo POST `List-Unsubscribe=One-Click`
// to the List-Unsubscribe URL — the email + token stay in the query string.
export async function POST(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid unsubscribe link.' }, { status: 400 });
  }

  const { email, token } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (!verifyUnsubscribeToken(normalizedEmail, token)) {
    return NextResponse.json({ error: 'Invalid or expired unsubscribe link.' }, { status: 400 });
  }

  try {
    const errorMessage = await performUnsubscribe(normalizedEmail);
    if (errorMessage) {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[unsubscribe] Error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
