-- Email events table — captures Resend webhook events so deliverability data
-- (bounce rate, complaint rate, delivery) persists beyond the free-tier 1-day
-- log retention and is queryable without paying for Pro analytics.
-- Run this in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

CREATE TABLE IF NOT EXISTS public.email_events (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Resend event type: email.sent | email.delivered | email.bounced |
  -- email.complained | email.delivery_delayed | email.opened | email.clicked
  event_type text NOT NULL,
  email_id   text,             -- Resend's email id (data.email_id)
  recipient  text,             -- first recipient (data.to[0])
  subject    text,
  payload    jsonb NOT NULL,   -- full event payload for debugging
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for rate queries (e.g. bounce rate over a window) and per-email lookups
CREATE INDEX IF NOT EXISTS email_events_type_created_at_idx ON public.email_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS email_events_email_id_idx ON public.email_events (email_id);

-- Only the service role can read/write (called from server-side webhook only)
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
-- No public policies — service role bypasses RLS by default
