import { createHmac, timingSafeEqual } from 'crypto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.nuclearhustle.com';

function getSecret(): string {
  // Pinned to the service role key. CRON_SECRET was never set in production, so
  // every existing unsubscribe link was signed with this value. Do not fall
  // back to CRON_SECRET — adding that variable would invalidate them.
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for unsubscribe tokens');
  }
  return secret;
}

export function createUnsubscribeToken(email: string): string {
  return createHmac('sha256', getSecret()).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = createUnsubscribeToken(email);
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function unsubscribeUrl(email: string): string {
  const normalized = email.toLowerCase();
  const token = createUnsubscribeToken(normalized);
  const params = new URLSearchParams({ email: normalized, token });
  return `${SITE_URL}/api/alerts/unsubscribe?${params.toString()}`;
}
