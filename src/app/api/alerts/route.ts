import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { subscribeToDigest } from '@/lib/email/subscription';

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

    const { ok } = await subscribeToDigest(email);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[alerts] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
