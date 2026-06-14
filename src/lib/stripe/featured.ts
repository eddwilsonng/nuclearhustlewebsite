import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

/** Single source of truth for featured-listing price and duration. */
export const FEATURED_PRICE_CENTS = 9900; // $99.00
export const FEATURED_DURATION_DAYS = 30;

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export interface CreateFeaturedCheckoutArgs {
  jobId: string;
  /** Authenticated employer's user id (auth.users.id). */
  userId: string;
  /** Buyer email — enables Stripe's emailed receipt and prefilled checkout. */
  customerEmail?: string | null;
  successUrl: string;
  cancelUrl: string;
}

export type CreateFeaturedCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

/**
 * Create a Stripe Checkout session to feature a job listing.
 *
 * Verifies the job belongs to the requesting employer, then builds a one-off
 * payment session with an emailed receipt + downloadable invoice. Shared by the
 * API route (Jobs-list button) and the new-job server action (inline upgrade).
 */
export async function createFeaturedCheckoutSession(
  args: CreateFeaturedCheckoutArgs
): Promise<CreateFeaturedCheckoutResult> {
  const { jobId, userId, customerEmail, successUrl, cancelUrl } = args;

  const supabase = await createClient();

  const { data: employerProfile } = await supabase
    .from('employer_profiles')
    .select('id, company_name')
    .eq('user_id', userId)
    .single();

  if (!employerProfile) {
    return { ok: false, status: 403, error: 'Employer profile not found' };
  }

  const { data: job } = await supabase
    .from('employer_jobs')
    .select('id, title, employer_id')
    .eq('id', jobId)
    .eq('employer_id', employerProfile.id)
    .single();

  if (!job) {
    return { ok: false, status: 404, error: 'Job not found' };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail ?? undefined,
    billing_address_collection: 'auto',
    invoice_creation: { enabled: true },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: FEATURED_PRICE_CENTS,
          product_data: {
            name: `Featured Job Listing (${FEATURED_DURATION_DAYS} days)`,
            description: `Pin "${job.title}" to the top of the Nuclear Hustle board and homepage for ${FEATURED_DURATION_DAYS} days — in front of nuclear professionals who are actively job-hunting.`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      jobId: job.id,
      employerId: employerProfile.id,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    return { ok: false, status: 500, error: 'Stripe did not return a checkout URL' };
  }

  return { ok: true, url: session.url };
}
