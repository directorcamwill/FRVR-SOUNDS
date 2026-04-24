-- 00028_release_plan.sql
-- Sprint G — Content + Sync Loop (orchestration target table).
-- One row per song; holds the release metadata the Content+Sync Loop
-- produces and the counters its follow-up agents update.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.release_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE UNIQUE,
  distributor_name TEXT,
  release_date DATE,
  isrc TEXT,
  one_sheet_url TEXT,
  stream_art_url TEXT,
  pre_save_url TEXT,

  -- Orchestrator output: a JSONB checklist the UI renders ("approve cover",
  -- "schedule pre-save", "ship one-sheet to supervisors"). Each item carries
  -- { key, label, done, owner?, due_offset_days? }.
  checklist JSONB DEFAULT '[]'::jsonb,

  content_moments_planned INT DEFAULT 0,
  content_moments_published INT DEFAULT 0,

  -- Last time the orchestrator ran and its batch_id of content_moments.
  last_orchestrated_at TIMESTAMPTZ,
  last_batch_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_release_plan_song ON public.release_plan(song_id);

DROP TRIGGER IF EXISTS release_plan_set_updated_at ON public.release_plan;
CREATE TRIGGER release_plan_set_updated_at
  BEFORE UPDATE ON public.release_plan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.release_plan ENABLE ROW LEVEL SECURITY;

-- Artists can read + write their own song's release plan.
DROP POLICY IF EXISTS "artists_read_own_release_plan" ON public.release_plan;
CREATE POLICY "artists_read_own_release_plan" ON public.release_plan
  FOR SELECT
  TO authenticated
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.artist_id IN (
        SELECT id FROM public.artists WHERE profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "artists_write_own_release_plan" ON public.release_plan;
CREATE POLICY "artists_write_own_release_plan" ON public.release_plan
  FOR ALL
  TO authenticated
  USING (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.artist_id IN (
        SELECT id FROM public.artists WHERE profile_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    song_id IN (
      SELECT s.id FROM public.songs s
      WHERE s.artist_id IN (
        SELECT id FROM public.artists WHERE profile_id = auth.uid()
      )
    )
  );
