-- Rate limits table for Supabase-backed serverless-safe rate limiting
-- Run this in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for fast window queries
CREATE INDEX IF NOT EXISTS rate_limits_key_created_at_idx ON public.rate_limits (key, created_at);

-- Auto-delete rows older than 1 hour to keep the table small
CREATE OR REPLACE FUNCTION delete_old_rate_limits() RETURNS trigger AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_rate_limits ON public.rate_limits;
CREATE TRIGGER cleanup_rate_limits
  AFTER INSERT ON public.rate_limits
  EXECUTE FUNCTION delete_old_rate_limits();

-- Only the service role can read/write (called from server-side only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No public policies — service role bypasses RLS by default
