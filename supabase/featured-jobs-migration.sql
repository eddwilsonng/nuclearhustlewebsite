-- Migration: Add featured job columns to employer_jobs
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

ALTER TABLE employer_jobs
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Index for fast featured job queries
CREATE INDEX IF NOT EXISTS idx_employer_jobs_featured
  ON employer_jobs (is_featured, featured_until)
  WHERE is_featured = TRUE;
