-- Brand Journey V2 — Artist Operating System.
-- Adds the Content Engine module (Module 8), the Niche Domination layer,
-- the Routes → Revenue upgrade, and per-module generated outputs.
--
-- See docs/V2_ARTIST_OPERATING_SYSTEM.md for the full spec.
-- The V1 journey (00025–00027) is preserved verbatim; this is purely additive.

ALTER TABLE public.brand_wiki
  -- ─── Module 1 — Identity (V2 addition) ───
  ADD COLUMN IF NOT EXISTS public_truth                 TEXT,

  -- ─── Module 3 — Niche Domination Layer ───
  -- Flat columns to keep parity with the rest of the journey schema; the
  -- spec's "niche block" is the union of these four fields.
  ADD COLUMN IF NOT EXISTS niche_micro_statement        TEXT,
  ADD COLUMN IF NOT EXISTS niche_competitors            JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS niche_gap                    TEXT,
  ADD COLUMN IF NOT EXISTS niche_ownable_territory      TEXT,

  -- ─── Module 7 — Routes → Revenue ───
  ADD COLUMN IF NOT EXISTS revenue_primary_path         TEXT,
  ADD COLUMN IF NOT EXISTS revenue_secondary_paths      TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS revenue_offer_100            TEXT,
  ADD COLUMN IF NOT EXISTS revenue_offer_1k             TEXT,
  ADD COLUMN IF NOT EXISTS revenue_offer_10k            TEXT,

  -- ─── Module 8 — Content Engine ───
  ADD COLUMN IF NOT EXISTS content_pillars              JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_formats              JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS platform_strategy            JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS weekly_cadence               JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hook_library                 JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conversion_path              JSONB DEFAULT '[]'::jsonb,

  -- ─── Cross-module artifacts (revenue + consistency) ───
  ADD COLUMN IF NOT EXISTS offer_ladder                 JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_revenue_map          JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS consistency_plan             JSONB DEFAULT '{}'::jsonb,

  -- ─── Per-module generated outputs ───
  -- Shape: { identity: {...}, emotional: {...}, ... }
  -- Each module's Output Layer (hooks, scripts, templates) lives here.
  ADD COLUMN IF NOT EXISTS module_outputs               JSONB DEFAULT '{}'::jsonb,

  -- ─── Broadcast tier — multi-segment audience modeling ───
  ADD COLUMN IF NOT EXISTS audience_models              JSONB DEFAULT '[]'::jsonb;


-- ─── Content pieces — every drafted/shipped post the artist produces ───
-- Backs the Weekly Execution Dashboard scoring panel.
CREATE TABLE IF NOT EXISTS public.content_pieces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  pillar_id       TEXT,                                  -- references content_pillars[].id
  format_id       TEXT,                                  -- references content_formats[].id
  platform        TEXT,                                  -- ig | tiktok | yt | x | newsletter | ...
  hook            TEXT,
  body            TEXT,
  cta             TEXT,
  fit_score       JSONB,                                 -- { identity_match, emotional_accuracy, audience_relevance, platform_fit, total, flags[], suggestions[] }
  fit_status      TEXT CHECK (fit_status IN ('draft', 'revise', 'ship_ready', 'anchor', 'shipped', 'archived')),
  scheduled_for   TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  external_url    TEXT,                                  -- the live post URL once shipped
  performance     JSONB DEFAULT '{}'::jsonb,             -- views/saves/replies/follows-from etc., manual or connector-fed
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_pieces_artist        ON public.content_pieces(artist_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_artist_status ON public.content_pieces(artist_id, fit_status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_shipped       ON public.content_pieces(artist_id, shipped_at DESC);

ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own content pieces" ON public.content_pieces;
CREATE POLICY "Users view own content pieces"
  ON public.content_pieces FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own content pieces" ON public.content_pieces;
CREATE POLICY "Users insert own content pieces"
  ON public.content_pieces FOR INSERT TO authenticated
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own content pieces" ON public.content_pieces;
CREATE POLICY "Users update own content pieces"
  ON public.content_pieces FOR UPDATE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users delete own content pieces" ON public.content_pieces;
CREATE POLICY "Users delete own content pieces"
  ON public.content_pieces FOR DELETE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));


-- ─── Streak log — one row per day the artist met their MVP plan ───
CREATE TABLE IF NOT EXISTS public.streak_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  pieces_shipped  INTEGER DEFAULT 0,
  mvp_met         BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_streak_log_artist_date ON public.streak_log(artist_id, log_date DESC);

ALTER TABLE public.streak_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own streak log" ON public.streak_log;
CREATE POLICY "Users view own streak log"
  ON public.streak_log FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users write own streak log" ON public.streak_log;
CREATE POLICY "Users write own streak log"
  ON public.streak_log FOR ALL TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()))
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));


-- ─── Feedback runs — the weekly Feedback Loop digest ───
CREATE TABLE IF NOT EXISTS public.feedback_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  signals         JSONB DEFAULT '{}'::jsonb,             -- top_signal, top_anti_signal, lift_by_pillar, lift_by_emotion, calibration_delta
  model_diff      JSONB DEFAULT '{}'::jsonb,             -- proposed audience_model + emotional_model updates
  applied         BOOLEAN DEFAULT FALSE,
  reverted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_feedback_runs_artist ON public.feedback_runs(artist_id, period_start DESC);

ALTER TABLE public.feedback_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own feedback runs" ON public.feedback_runs;
CREATE POLICY "Users view own feedback runs"
  ON public.feedback_runs FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));
