-- Job alerts / email subscribers table
CREATE TABLE IF NOT EXISTS public.job_alert_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ DEFAULT NULL,
  unsubscribed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique on email so duplicate signups are idempotent
CREATE UNIQUE INDEX IF NOT EXISTS job_alert_subscribers_email_idx
  ON public.job_alert_subscribers (email);

-- No RLS — this table is only accessed via service role key from API routes
ALTER TABLE public.job_alert_subscribers DISABLE ROW LEVEL SECURITY;
