-- Security fixes for Nuclear Hustle
-- Run these in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

-- ===========================================
-- 1. Prevent role escalation via profiles UPDATE
-- ===========================================
-- Current policy allows updating ANY column including 'role'.
-- This replaces it with a policy that prevents changing the role.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- ===========================================
-- 2. Add missing columns to employer_jobs
-- ===========================================
ALTER TABLE public.employer_jobs ADD COLUMN IF NOT EXISTS application_type TEXT DEFAULT 'link';
ALTER TABLE public.employer_jobs ADD COLUMN IF NOT EXISTS application_email TEXT;
ALTER TABLE public.employer_jobs ADD COLUMN IF NOT EXISTS structured_description JSONB;

-- ===========================================
-- 3. Restrict employer_jobs SELECT to hide sensitive columns
-- ===========================================
-- Creates a public view that omits application_email (PII)

CREATE OR REPLACE VIEW public.employer_jobs_public AS
  SELECT
    id, employer_id, title, slug, location, state, category,
    description, structured_description, employment_type,
    application_type, is_active, expires_at, created_at
  FROM public.employer_jobs
  WHERE is_active = true;

GRANT SELECT ON public.employer_jobs_public TO anon, authenticated;

-- ===========================================
-- 4. Prevent job_seekers from creating employer_profiles
-- ===========================================
-- Current INSERT policy only checks user_id = auth.uid(), not role.

DROP POLICY IF EXISTS "Users can create own employer profile" ON public.employer_profiles;

CREATE POLICY "Employers can create own employer profile" ON public.employer_profiles
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'employer'
    )
  );


-- ===========================================
-- 5. Storage policy for public application uploads
-- ===========================================
-- The current storage policies require auth.uid() as the first path segment.
-- Applications from unauthenticated users need a separate policy or bucket.
-- Option: Create a separate "applications" bucket with appropriate policies.
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('applications', 'applications', false);
--
-- CREATE POLICY "Anyone can upload application files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'applications');
--
-- CREATE POLICY "Authenticated users can read application files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'applications' AND auth.role() = 'authenticated');
