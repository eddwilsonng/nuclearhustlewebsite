import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Resend signs webhooks with Svix. We verify the signature manually here to
// avoid pulling in the `svix` dependency for a single endpoint.
// Docs: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
function verifySignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  body: string,
  svixSignatureHeader: string
): boolean {
  // The secret is `whsec_<base64>`; the HMAC key is the decoded base64 portion.
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  // Header looks like "v1,<sig> v1,<sig2>" — accept if any provided sig matches.
  const expectedBuf = Buffer.from(expected);
  return svixSignatureHeader.split(' ').some((part) => {
    const sig = part.split(',')[1];
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }

  // Read the raw body — the signature is computed over the exact bytes.
  const body = await request.text();

  if (!verifySignature(secret, svixId, svixTimestamp, body, svixSignature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data = event.data ?? {};
  const to = data.to;
  const recipient = Array.isArray(to) ? (to[0] as string | undefined) : (to as string | undefined);

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('email_events').insert({
      event_type: event.type ?? 'unknown',
      email_id: (data.email_id as string | undefined) ?? null,
      recipient: recipient ?? null,
      subject: (data.subject as string | undefined) ?? null,
      payload: event,
    });

    if (error) {
      console.error('[resend-webhook] DB insert error:', error);
      // Return 200 anyway so Resend doesn't retry indefinitely on a DB hiccup;
      // the error is logged for follow-up.
      return NextResponse.json({ received: true, stored: false });
    }
  } catch (err) {
    console.error('[resend-webhook] Error:', err);
    return NextResponse.json({ received: true, stored: false });
  }

  return NextResponse.json({ received: true });
}
