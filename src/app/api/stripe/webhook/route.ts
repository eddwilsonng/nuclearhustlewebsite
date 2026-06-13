import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { jobId } = session.metadata ?? {};

    if (!jobId) {
      console.error('Missing jobId in session metadata');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = await createClient();

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + 30);

    const { error } = await supabase
      .from('employer_jobs')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('Failed to update featured status:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
