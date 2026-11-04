-- Account onboarding (Nov 2026)
-- Run in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new
-- Safe to re-run. Additive only: the current production code keeps working
-- before and after this runs.

-- ===========================================
-- 1. Profile fields used by onboarding
-- ===========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- The field a job seeker works in (a src/lib/categorize.ts category slug).
-- Drives "New roles for you" on the seeker overview.
ALTER TABLE public.job_seeker_profiles
  ADD COLUMN IF NOT EXISTS primary_category TEXT;

-- ===========================================
-- 2. Employer email verification
-- ===========================================
-- Kept out of employer_profiles on purpose: employers can UPDATE their own
-- employer_profiles row through PostgREST, so a verified flag there could be
-- set by the employer themselves. This table has RLS on and no policies, so
-- only the service role (the app server) can read or write it.
CREATE TABLE IF NOT EXISTS public.email_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code_hash TEXT,
  code_expires_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Every employer that exists before this migration is treated as verified, so
-- nobody already posting is locked out.
INSERT INTO public.email_verifications (user_id, email, verified_at)
SELECT ep.user_id, p.email, COALESCE(ep.created_at, now())
FROM public.employer_profiles ep
JOIN public.profiles p ON p.id = ep.user_id
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_email_verified(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.email_verifications
    WHERE user_id = uid AND verified_at IS NOT NULL
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_email_verified(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_email_verified(UUID) TO authenticated, service_role;

-- Only verified employers can create listings, even straight through PostgREST.
DROP POLICY IF EXISTS "Employers can insert own jobs" ON public.employer_jobs;
DROP POLICY IF EXISTS "Verified employers can insert own jobs" ON public.employer_jobs;
CREATE POLICY "Verified employers can insert own jobs" ON public.employer_jobs
  FOR INSERT WITH CHECK (
    employer_id IN (
      SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
    )
    AND public.is_email_verified(auth.uid())
  );

-- ===========================================
-- 3. Link applications to signed-in applicants
-- ===========================================
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_user_id
  ON public.job_applications (applicant_user_id);

DO $$ BEGIN
  CREATE POLICY "Applicants can view own applications" ON public.job_applications
    FOR SELECT USING (applicant_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===========================================
-- 4. Employer profile insert: require the employer role
-- ===========================================
-- security-fixes.sql dropped "Users can create own employer profile", but
-- schema.sql created the policy as "Users can insert own employer profile".
-- Policies combine with OR, so the permissive one still let job seekers create
-- an employer profile. Drop it by its real name.
DROP POLICY IF EXISTS "Users can insert own employer profile" ON public.employer_profiles;

DO $$ BEGIN
  CREATE POLICY "Employers can create own employer profile" ON public.employer_profiles
    FOR INSERT
    WITH CHECK (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'employer'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
