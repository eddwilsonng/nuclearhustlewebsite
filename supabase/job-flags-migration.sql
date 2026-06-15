-- Job flags — anonymous listing reports (rate-limited by IP hash)
-- Run in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

CREATE TABLE IF NOT EXISTS public.job_flags (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_slug   text NOT NULL,
  reason     text NOT NULL CHECK (reason IN ('broken_link','job_filled','expired','scam','incorrect_details')),
  notes      text,
  ip_hash    text,
  flagged_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS job_flags_job_slug_idx ON public.job_flags (job_slug);

ALTER TABLE public.job_flags ENABLE ROW LEVEL SECURITY;
-- No public policies — written exclusively via service role from the API route
