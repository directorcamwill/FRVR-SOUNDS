-- Artist Brand Wiki — the foundational identity layer referenced by every
-- new growth agent (Brand Director, Content Director, Outreach, etc.) per
-- EVOLUTION_PLAN_ADDENDUM.md §2.
--
-- Fully idempotent: safe to re-run on partial-state DBs (e.g. if an earlier
-- paste created the table + some policies then errored).

CREATE TABLE IF NOT EXISTS public.brand_wiki (
  artist_id UUID PRIMARY KEY REFERENCES public.artists(id) ON DELETE CASCADE,

  -- Identity
  niche TEXT,
  elevator_pitch TEXT,
  origin_story TEXT,
  bio_short TEXT,
  bio_medium TEXT,
  bio_long TEXT,

  -- Audience
  primary_audience TEXT,
  secondary_audience TEXT,
  audience_pain_points TEXT[] DEFAULT '{}',

  -- Tone + voice
  tone_descriptors TEXT[] DEFAULT '{}',
  voice_dos TEXT[] DEFAULT '{}',
  voice_donts TEXT[] DEFAULT '{}',
  core_messaging TEXT,

  -- Visual identity
  color_primary TEXT,
  color_secondary TEXT,
  color_accent TEXT,
  font_heading TEXT,
  font_body TEXT,
  texture_keywords TEXT[] DEFAULT '{}',
  logo_url TEXT,
  icon_url TEXT,
  press_photo_urls TEXT[] DEFAULT '{}',

  -- Sonic identity
  sonic_genre_primary TEXT,
  sonic_genre_secondary TEXT,
  sonic_moods TEXT[] DEFAULT '{}',
  sonic_bpm_min INTEGER,
  sonic_bpm_max INTEGER,
  sonic_key_preferences TEXT[] DEFAULT '{}',
  sonic_texture_keywords TEXT[] DEFAULT '{}',
  reference_tracks JSONB DEFAULT '[]'::jsonb,

  -- Mix/master preferences
  mix_preferences JSONB DEFAULT '{}'::jsonb,

  -- Sync positioning
  sync_format_targets TEXT[] DEFAULT '{}',
  sync_library_targets TEXT[] DEFAULT '{}',
  avoid_sync_formats TEXT[] DEFAULT '{}',

  -- Meta
  completeness_pct INTEGER DEFAULT 0 CHECK (completeness_pct >= 0 AND completeness_pct <= 100),
  last_guided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_wiki ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own brand_wiki" ON public.brand_wiki;
CREATE POLICY "Users view own brand_wiki"
  ON public.brand_wiki FOR SELECT TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert own brand_wiki" ON public.brand_wiki;
CREATE POLICY "Users insert own brand_wiki"
  ON public.brand_wiki FOR INSERT TO authenticated
  WITH CHECK (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users update own brand_wiki" ON public.brand_wiki;
CREATE POLICY "Users update own brand_wiki"
  ON public.brand_wiki FOR UPDATE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP POLICY IF EXISTS "Users delete own brand_wiki" ON public.brand_wiki;
CREATE POLICY "Users delete own brand_wiki"
  ON public.brand_wiki FOR DELETE TO authenticated
  USING (artist_id IN (SELECT id FROM public.artists WHERE profile_id = auth.uid()));

DROP TRIGGER IF EXISTS update_brand_wiki_updated_at ON public.brand_wiki;
CREATE TRIGGER update_brand_wiki_updated_at
  BEFORE UPDATE ON public.brand_wiki
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
