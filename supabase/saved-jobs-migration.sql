-- Saved jobs — lets authenticated users bookmark jobs
-- Run in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  job_slug  text NOT NULL,
  job_id    text NOT NULL,
  saved_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, job_slug)
);

CREATE INDEX IF NOT EXISTS saved_jobs_user_id_idx ON public.saved_jobs (user_id);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved jobs" ON public.saved_jobs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
