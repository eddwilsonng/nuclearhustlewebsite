import { createHmac, timingSafeEqual } from 'crypto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nuclearhustle.com';

function getSecret(): string {
  const secret = process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error('Missing CRON_SECRET env var for unsubscribe tokens');
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
