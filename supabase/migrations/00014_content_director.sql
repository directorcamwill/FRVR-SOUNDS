-- Content Director extension — adds rich source/trace fields to content_moments
-- so the Content Director agent can emit brand-aware variants and the UI can
-- render them grouped by source event. Per EVOLUTION_PLAN_ADDENDUM §3.1.
--
-- Fully idempotent.

-- Drop the old CHECK constraint on content_type (if it exists), then re-add
-- with the expanded vocabulary.
ALTER TABLE public.content_moments
  DROP CONSTRAINT IF EXISTS content_moments_content_type_check;

ALTER TABLE public.content_moments
  ADD CONSTRAINT content_moments_content_type_check
  CHECK (content_type IN (
    'social_post',
    'email',
    'press_release',
    'story',
    'reel',
    'video_script',
    'caption',
    'hook_pack'
  ));

ALTER TABLE public.content_moments
  ADD COLUMN IF NOT EXISTS source_agent TEXT,
  ADD COLUMN IF NOT EXISTS source_moment_type TEXT
    CHECK (
      source_moment_type IS NULL OR source_moment_type IN (
        'song_release',
        'placement_win',
        'behind_scenes',
        'catalog_update',
        'brand_story'
      )
    ),
  ADD COLUMN IF NOT EXISTS source_song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4)
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  ADD COLUMN IF NOT EXISTS reasoning TEXT,
  ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hook_ideas TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_content_moments_source_song
  ON public.content_moments(source_song_id)
  WHERE source_song_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_moments_batch
  ON public.content_moments(batch_id)
  WHERE batch_id IS NOT NULL;
