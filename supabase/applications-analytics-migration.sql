-- Migration: applications pipeline, per-job analytics, auto-expiry, company logos
-- Run in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new
-- Safe to re-run.

-- 1. Per-job analytics + company branding -----------------------------------
ALTER TABLE public.employer_jobs
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Atomic view increment (avoids read-modify-write races)
CREATE OR REPLACE FUNCTION public.increment_job_views(p_job_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.employer_jobs
  SET view_count = view_count + 1
  WHERE id = p_job_id;
$$;

-- 2. Job applications --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.employer_jobs(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  message TEXT,
  cv_path TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'shortlisted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_employer_id ON public.job_applications(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Employers can read applications to their own jobs
DO $$ BEGIN
  CREATE POLICY "Employers can view own applications" ON public.job_applications
    FOR SELECT USING (
      employer_id IN (
        SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Employers can update status on their own applications
DO $$ BEGIN
  CREATE POLICY "Employers can update own applications" ON public.job_applications
    FOR UPDATE USING (
      employer_id IN (
        SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Inserts come from the public apply endpoint via the service-role client,
-- which bypasses RLS, so no public INSERT policy is granted here.

-- 3. Company logo storage ----------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Anyone can view company logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-logos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can upload company logo" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'company-logos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can update company logo" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'company-logos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can delete company logo" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'company-logos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Auto-expiry backfill ----------------------------------------------------
-- Default active jobs without an expiry to 60 days from creation.
UPDATE public.employer_jobs
SET expires_at = created_at + INTERVAL '60 days'
WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employer_jobs_expires_at
  ON public.employer_jobs (expires_at);
