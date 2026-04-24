-- 00029_automation.sql
-- Sprint F — Automation Agent + jobs queue foundation.
-- Two tables: `automation_schedules` (per-artist recurring-job toggles) and
-- `jobs_queue` (work the cron worker picks up). Idempotent.

-- ─── automation_schedules ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (
    schedule_type IN ('weekly_digest', 'daily_outreach_nudge', 'release_content_burst')
  ),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cron_expression TEXT,  -- informational; the dispatcher uses schedule_type + last_run_at
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (artist_id, schedule_type)
);

CREATE INDEX IF NOT EXISTS idx_automation_schedules_artist
  ON public.automation_schedules(artist_id);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_enabled_type
  ON public.automation_schedules(enabled, schedule_type)
  WHERE enabled = TRUE;

DROP TRIGGER IF EXISTS automation_schedules_set_updated_at ON public.automation_schedules;
CREATE TRIGGER automation_schedules_set_updated_at
  BEFORE UPDATE ON public.automation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artists_rw_own_automation_schedules" ON public.automation_schedules;
CREATE POLICY "artists_rw_own_automation_schedules" ON public.automation_schedules
  FOR ALL
  TO authenticated
  USING (
    artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())
  );

-- ─── jobs_queue ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.jobs_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (
    job_type IN ('weekly_digest', 'daily_outreach_nudge', 'release_content_burst')
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'failed')
  ),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  error_message TEXT,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_queue_status_run_at
  ON public.jobs_queue(status, run_at)
  WHERE status IN ('pending', 'running');
CREATE INDEX IF NOT EXISTS idx_jobs_queue_artist
  ON public.jobs_queue(artist_id);

ALTER TABLE public.jobs_queue ENABLE ROW LEVEL SECURITY;

-- Artists read their own jobs (for history / admin surface).
DROP POLICY IF EXISTS "artists_read_own_jobs" ON public.jobs_queue;
CREATE POLICY "artists_read_own_jobs" ON public.jobs_queue
  FOR SELECT
  TO authenticated
  USING (
    artist_id IS NULL
    OR artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid())
  );
-- Writes are service-role-only (the cron worker uses the admin client).
