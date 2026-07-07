-- Migration: weekly curated picks ("This week in nuclear")
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new
--
-- One row per ISO week. Written by the admin curation console
-- (/dashboard/admin/linkedin), read by the public /this-week page and the
-- LinkedIn draft. Stores job slugs (the stable, human-readable URL identity)
-- rather than ids.

CREATE TABLE IF NOT EXISTS weekly_picks (
  week_id      TEXT PRIMARY KEY,          -- ISO week, e.g. "2026-W28"
  job_slugs    JSONB NOT NULL,            -- ordered array of job slugs
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Latest-week lookups order by published_at.
CREATE INDEX IF NOT EXISTS idx_weekly_picks_published
  ON weekly_picks (published_at DESC);

ALTER TABLE weekly_picks ENABLE ROW LEVEL SECURITY;

-- Public read: the /this-week page is served to anonymous visitors.
DROP POLICY IF EXISTS "weekly_picks public read" ON weekly_picks;
CREATE POLICY "weekly_picks public read"
  ON weekly_picks FOR SELECT USING (TRUE);

-- Writes are gated in app code by isAdmin(); RLS just blocks anon writes.
DROP POLICY IF EXISTS "weekly_picks auth insert" ON weekly_picks;
CREATE POLICY "weekly_picks auth insert"
  ON weekly_picks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "weekly_picks auth update" ON weekly_picks;
CREATE POLICY "weekly_picks auth update"
  ON weekly_picks FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
