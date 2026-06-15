import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';

const VALID_REASONS = ['broken_link', 'job_filled', 'expired', 'scam', 'incorrect_details'] as const;

const flagSchema = z.object({
  jobSlug: z.string().min(1).max(200),
  reason: z.enum(VALID_REASONS),
  notes: z.string().max(500).optional(),
});

const RATE_LIMIT_WINDOW_SECONDS = 24 * 60 * 60;
const RATE_LIMIT_MAX = 3;

async function isRateLimited(ipHash: string, jobSlug: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const key = `flag:${ipHash}:${jobSlug}`;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();

    const { count } = await admin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX) return true;

    await admin.from('rate_limits').insert({ key });
    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

  const body = await req.json();
  const parsed = flagSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { jobSlug, reason, notes } = parsed.data;

  if (await isRateLimited(ipHash, jobSlug)) {
    return NextResponse.json({ error: 'Too many reports' }, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('job_flags').insert({
      job_slug: jobSlug,
      reason,
      notes: notes ?? null,
      ip_hash: ipHash,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flagged: true });
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
