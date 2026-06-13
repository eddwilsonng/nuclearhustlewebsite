-- Nuclear Hustle Database Schema
-- Safe to re-run — all statements use IF NOT EXISTS / OR REPLACE / ON CONFLICT

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles with role
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('job_seeker', 'employer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job seeker profiles
CREATE TABLE IF NOT EXISTS public.job_seeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location TEXT,
  resume_url TEXT,
  resume_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Employer profiles
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_slug TEXT UNIQUE NOT NULL,
  company_website TEXT,
  company_description TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Employer-posted jobs
CREATE TABLE IF NOT EXISTS public.employer_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location TEXT NOT NULL,
  state TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  employment_type TEXT DEFAULT 'full-time',
  application_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON public.job_seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON public.employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_slug ON public.employer_profiles(company_slug);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_employer_id ON public.employer_jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_slug ON public.employer_jobs(slug);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_state ON public.employer_jobs(state);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_category ON public.employer_jobs(category);
CREATE INDEX IF NOT EXISTS idx_employer_jobs_active ON public.employer_jobs(is_active);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Job seeker profile policies
DO $$ BEGIN
  CREATE POLICY "Users can view own job seeker profile" ON public.job_seeker_profiles
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own job seeker profile" ON public.job_seeker_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own job seeker profile" ON public.job_seeker_profiles
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Employer profile policies
DO $$ BEGIN
  CREATE POLICY "Anyone can view employer profiles" ON public.employer_profiles
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own employer profile" ON public.employer_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own employer profile" ON public.employer_profiles
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Employer jobs policies
DO $$ BEGIN
  CREATE POLICY "Anyone can view active employer jobs" ON public.employer_jobs
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Employers can view own jobs" ON public.employer_jobs
    FOR SELECT USING (
      employer_id IN (
        SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Employers can insert own jobs" ON public.employer_jobs
    FOR INSERT WITH CHECK (
      employer_id IN (
        SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Employers can update own jobs" ON public.employer_jobs
    FOR UPDATE USING (
      employer_id IN (
        SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Employers can delete own jobs" ON public.employer_jobs
    FOR DELETE USING (
      employer_id IN (
        SELECT id FROM public.employer_profiles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  CREATE POLICY "Users can upload own resume" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'resumes' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own resume" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'resumes' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own resume" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'resumes' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own resume" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'resumes' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
