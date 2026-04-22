-- Brand Journey — module-driven brand building for the Brand tab v2.
-- Adds structured Identity / Emotional Signature / Positioning / Audience
-- fields to brand_wiki, plus journey state + a raw-responses log table.
--
-- brand_wiki holds the refined / canonical state (read by every growth agent
-- via brandContextToPrompt). brand_module_responses holds the source-of-truth
-- answers the artist typed, plus any Director's-Notes refinement history.
--
-- Fully idempotent: safe to re-run.

ALTER TABLE public.brand_wiki
  -- Module 1 — Identity
  ADD COLUMN IF NOT EXISTS core_pain              TEXT,
  ADD COLUMN IF NOT EXISTS transformation_before  TEXT,
  ADD COLUMN IF NOT EXISTS transformation_after   TEXT,
  ADD COLUMN IF NOT EXISTS core_beliefs           TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS key_themes             TEXT[]  DEFAULT '{}',

  -- Module 2 — Emotional Signature
  ADD COLUMN IF NOT EXISTS desired_emotions       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS natural_emotions       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emotional_tags         TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS energy_marker          INTEGER CHECK (energy_marker BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS intensity_marker       INTEGER CHECK (intensity_marker BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS intensity_notes        TEXT,

  -- Module 3 — Positioning
  ADD COLUMN IF NOT EXISTS positioning_statement  TEXT,
  ADD COLUMN IF NOT EXISTS differentiators        TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_lane          TEXT,
  ADD COLUMN IF NOT EXISTS what_not               JSONB   DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS competitive_contrast   JSONB   DEFAULT '[]'::jsonb,

  -- Module 4 — Audience (supplements primary_audience + audience_pain_points)
  ADD COLUMN IF NOT EXISTS audience_desires            TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audience_lifestyle_context  TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS audience_identity_goals     TEXT,

  -- Journey state — where the artist is in the course + per-module status
  ADD COLUMN IF NOT EXISTS current_module_id      TEXT,
  ADD COLUMN IF NOT EXISTS current_step_id        TEXT,
  ADD COLUMN IF NOT EXISTS module_locked_at       JSONB   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS module_completeness    JSONB   DEFAULT '{}'::jsonb;

-- Raw user answers per module question. One row per (artist, module, question).
-- Kept indefinitely as audit trail + input for future Director's-Notes re-runs.
CREATE TABLE IF NOT EXISTS public.brand_module_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  module_id        TEXT NOT NULL,
  question_id      TEXT NOT NULL,
  field_key        TEXT NOT NULL,
  raw_answer       TEXT,
  refined_answer   TEXT,
  critique         JSONB,
  confidence       NUMERIC,
  accepted_refine  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, module_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_bmr_artist ON public.brand_module_responses(artist_id);
CREATE INDEX IF NOT EXISTS idx_bmr_module ON public.brand_module_responses(artist_id, module_id);

ALTER TABLE public.brand_module_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own responses" ON public.brand_module_responses;
CREATE POLICY "Users view own responses"
  ON public.brand_module_responses FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own responses" ON public.brand_module_responses;
CREATE POLICY "Users insert own responses"
  ON public.brand_module_responses FOR INSERT TO authenticated
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own responses" ON public.brand_module_responses;
CREATE POLICY "Users update own responses"
  ON public.brand_module_responses FOR UPDATE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users delete own responses" ON public.brand_module_responses;
CREATE POLICY "Users delete own responses"
  ON public.brand_module_responses FOR DELETE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP TRIGGER IF EXISTS update_brand_module_responses_updated_at ON public.brand_module_responses;
CREATE TRIGGER update_brand_module_responses_updated_at
  BEFORE UPDATE ON public.brand_module_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
