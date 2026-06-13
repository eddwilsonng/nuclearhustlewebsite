import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const FEATURED_JOB_PRICE_CENTS = 9900; // $99.00

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the job belongs to this employer
    const { data: employerProfile } = await supabase
      .from('employer_profiles')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single();

    if (!employerProfile) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 403 });
    }

    const { data: job } = await supabase
      .from('employer_jobs')
      .select('id, title, employer_id')
      .eq('id', jobId)
      .eq('employer_id', employerProfile.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: FEATURED_JOB_PRICE_CENTS,
            product_data: {
              name: 'Featured Job Listing — 30 Days',
              description: `Feature "${job.title}" at the top of Nuclear Hustle for 30 days`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        jobId: job.id,
        employerId: employerProfile.id,
      },
      success_url: `${siteUrl}/dashboard/jobs?featured=success`,
      cancel_url: `${siteUrl}/dashboard/jobs`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
