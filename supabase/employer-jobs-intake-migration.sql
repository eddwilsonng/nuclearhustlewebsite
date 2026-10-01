-- Structured intake fields for employer-posted jobs. Safe to re-run.

ALTER TABLE public.employer_jobs
  ADD COLUMN IF NOT EXISTS work_mode TEXT NOT NULL DEFAULT 'on-site',
  ADD COLUMN IF NOT EXISTS plant_id TEXT,
  ADD COLUMN IF NOT EXISTS salary_min NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_max NUMERIC,
  ADD COLUMN IF NOT EXISTS salary_period TEXT;

DO $$ BEGIN
  ALTER TABLE public.employer_jobs
    ADD CONSTRAINT employer_jobs_work_mode_check
    CHECK (work_mode IN ('on-site', 'hybrid', 'remote'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.employer_jobs
    ADD CONSTRAINT employer_jobs_salary_period_check
    CHECK (salary_period IS NULL OR salary_period IN ('hour', 'year'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.employer_jobs
    ADD CONSTRAINT employer_jobs_salary_range_check
    CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
