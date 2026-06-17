-- Job seeker profile fields — structured state, looking status, phone
-- Run in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

ALTER TABLE public.job_seeker_profiles
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS is_actively_looking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS phone text;

-- Note: `location` holds the city (kept as-is, not renamed, to avoid touching
-- every existing reference). `state` is the new structured field.
